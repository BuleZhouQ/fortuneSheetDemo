package com.demo.collab.ws
import com.demo.collab.auth.TokenService
import com.demo.collab.workbook.WorkbookService
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Component
import org.springframework.web.socket.*
import org.springframework.web.socket.handler.TextWebSocketHandler
import java.net.URI
import java.util.concurrent.ConcurrentHashMap
@Component class CollaborationHandler(private val mapper:ObjectMapper,private val tokens:TokenService,private val service:WorkbookService,private val redis:StringRedisTemplate):TextWebSocketHandler(){
 private val rooms=ConcurrentHashMap<String,MutableSet<WebSocketSession>>()
 private fun query(uri:URI?,key:String)=uri?.query?.split("&")?.mapNotNull{val p=it.split("=",limit=2);if(p.size==2)p[0] to java.net.URLDecoder.decode(p[1],"UTF-8") else null}?.toMap()?.get(key)
 override fun afterConnectionEstablished(s:WebSocketSession){val token=query(s.uri,"token")?:return s.close(CloseStatus.NOT_ACCEPTABLE);try{s.attributes["user"]=tokens.username(token)}catch(e:Exception){s.close(CloseStatus.NOT_ACCEPTABLE)}}
 override fun handleTextMessage(s:WebSocketSession,message:TextMessage){val user=s.attributes["user"] as? String?:return;val msg=mapper.readTree(message.payload);when(msg["type"]?.asText()){
 "join"->{val room=msg["room"].asText();s.attributes["room"]=room;rooms.computeIfAbsent(room){ConcurrentHashMap.newKeySet()}.add(s);service.ensureMember(room,user);redis.opsForSet().add("collab:room:$room:users",user);val doc=service.load(room,mapper);send(s,mapOf("type" to "snapshot","room" to room,"data" to mapper.readTree(doc.snapshot),"revision" to doc.revision,"users" to users(room)));broadcast(room,mapOf("type" to "presence","users" to users(room))) }
  "op"->{val room=s.attributes["room"] as? String?:return;val payload=msg["op"]?:return;val snapshot=payload.get("snapshot");val ops=payload.get("op")?:mapper.createArrayNode();val revision=if(snapshot!=null&&!snapshot.isNull)service.save(room,user,ops,snapshot).revision else redis.opsForValue().increment("collab:room:$room:revision")?:1L;broadcast(room,mapOf("type" to "remote-op","user" to user,"revision" to revision,"op" to payload),s)}
 }}
 private fun users(room:String)=rooms[room].orEmpty().mapNotNull{it.attributes["user"] as? String}.distinct()
 private fun send(s:WebSocketSession,v:Any){if(s.isOpen)s.sendMessage(TextMessage(mapper.writeValueAsString(v)))}
 private fun broadcast(room:String,v:Any,exclude:WebSocketSession?=null)=rooms[room].orEmpty().filter{it!=exclude&&it.isOpen}.forEach{send(it,v)}
 override fun afterConnectionClosed(s:WebSocketSession,status:CloseStatus){val room=s.attributes["room"] as? String?:return;rooms[room]?.remove(s);val user=s.attributes["user"] as? String;if(user!=null)redis.opsForSet().remove("collab:room:$room:users",user);broadcast(room,mapOf("type" to "presence","users" to users(room)))}
}

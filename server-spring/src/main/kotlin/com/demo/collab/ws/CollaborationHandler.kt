package com.demo.collab.ws

import com.demo.collab.auth.TokenService
import com.demo.collab.workbook.WorkbookService
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Component
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler
import java.net.URI
import java.net.URLDecoder
import java.util.concurrent.ConcurrentHashMap

@Component
class CollaborationHandler(
    private val mapper: ObjectMapper,
    private val tokens: TokenService,
    private val service: WorkbookService,
    private val redis: StringRedisTemplate
) : TextWebSocketHandler() {

    private val rooms = ConcurrentHashMap<String, MutableSet<WebSocketSession>>()

    private fun query(uri: URI?, key: String): String? {
        return uri?.query?.split("&")
            ?.mapNotNull {
                val p = it.split("=", limit = 2)
                if (p.size == 2) p[0] to URLDecoder.decode(p[1], "UTF-8") else null
            }
            ?.toMap()
            ?.get(key)
    }

    override fun afterConnectionEstablished(session: WebSocketSession) {
        val token = query(session.uri, "token") ?: return session.close(CloseStatus.NOT_ACCEPTABLE)
        try {
            session.attributes["user"] = tokens.username(token)
        } catch (e: Exception) {
            session.close(CloseStatus.NOT_ACCEPTABLE)
        }
    }

    override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        val user = session.attributes["user"] as? String ?: return
        val msg = mapper.readTree(message.payload)
        when (msg["type"]?.asText()) {
            "join" -> {
                val room = msg["room"].asText()
                session.attributes["room"] = room
                rooms.computeIfAbsent(room) { ConcurrentHashMap.newKeySet() }.add(session)
                service.ensureMember(room, user)
                redis.opsForSet().add("collab:room:$room:users", user)
                val doc = service.load(room, mapper)
                send(
                    session,
                    mapOf(
                        "type" to "snapshot",
                        "room" to room,
                        "data" to mapper.readTree(doc.snapshot),
                        "revision" to doc.revision,
                        "users" to users(room)
                    )
                )
                broadcast(room, mapOf("type" to "presence", "users" to users(room)))
            }

            "op" -> {
                val room = session.attributes["room"] as? String ?: return
                val payload = msg["op"] ?: return
                val snapshot = payload.get("snapshot")
                val ops = payload.get("op") ?: mapper.createArrayNode()
                val revision = if (snapshot != null && !snapshot.isNull) {
                    service.save(room, user, ops, snapshot).revision
                } else {
                    redis.opsForValue().increment("collab:room:$room:revision") ?: 1L
                }
                broadcast(
                    room,
                    mapOf("type" to "remote-op", "user" to user, "revision" to revision, "op" to payload),
                    session
                )
            }
        }
    }

    private fun users(room: String): List<String> {
        return rooms[room].orEmpty().mapNotNull { it.attributes["user"] as? String }.distinct()
    }

    private fun send(session: WebSocketSession, value: Any) {
        if (session.isOpen) {
            session.sendMessage(TextMessage(mapper.writeValueAsString(value)))
        }
    }

    private fun broadcast(room: String, value: Any, exclude: WebSocketSession? = null) {
        rooms[room].orEmpty()
            .filter { it != exclude && it.isOpen }
            .forEach { send(it, value) }
    }

    override fun afterConnectionClosed(session: WebSocketSession, status: CloseStatus) {
        val room = session.attributes["room"] as? String ?: return
        rooms[room]?.remove(session)
        val user = session.attributes["user"] as? String
        if (user != null) {
            redis.opsForSet().remove("collab:room:$room:users", user)
        }
        broadcast(room, mapOf("type" to "presence", "users" to users(room)))
    }
}

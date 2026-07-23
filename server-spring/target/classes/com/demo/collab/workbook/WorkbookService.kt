package com.demo.collab.workbook
import com.fasterxml.jackson.databind.JsonNode
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Service
import java.time.Instant
@Service class WorkbookService(private val workbooks:WorkbookRepository,private val members:MemberRepository,private val operations:OperationRepository,private val redis:StringRedisTemplate){
 private val defaultSnapshot="""[{"name":"试卷协同示例","status":1,"row":84,"column":60,"config":{},"celldata":[{"r":0,"c":0,"v":{"v":"题号","m":"题号"}},{"r":0,"c":1,"v":{"v":"题目","m":"题目"}},{"r":0,"c":2,"v":{"v":"答案","m":"答案"}}]}]"""
 fun load(room:String,mapper:com.fasterxml.jackson.databind.ObjectMapper):WorkbookDocument=workbooks.findByRoomId(room)?:workbooks.save(WorkbookDocument(roomId=room,snapshot=defaultSnapshot,updatedBy="system"))
 @Synchronized fun save(room:String,user:String,ops:JsonNode,snapshot:JsonNode):WorkbookDocument{val doc=workbooks.findByRoomId(room)?:WorkbookDocument(roomId=room,snapshot=snapshot.toString(),updatedBy=user);doc.revision++;doc.snapshot=snapshot.toString();doc.updatedBy=user;doc.updatedAt=Instant.now();val saved=workbooks.save(doc);operations.save(OperationLog(roomId=room,revision=saved.revision,username=user,operations=ops.toString()));redis.opsForValue().set("collab:room:$room:revision",saved.revision.toString());return saved}
 fun ensureMember(room:String,user:String)=members.findByRoomIdAndUsername(room,user)?:members.save(WorkbookMember(roomId=room,username=user))
}

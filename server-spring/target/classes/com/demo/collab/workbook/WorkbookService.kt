package com.demo.collab.workbook

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class WorkbookService(
    private val workbooks: WorkbookRepository,
    private val members: MemberRepository,
    private val operations: OperationRepository,
    private val redis: StringRedisTemplate
) {
    companion object {
        const val YJS_UPDATE_KIND = "yjs-update"
    }

    private val defaultSnapshot = """[{"id":"assessment-sheet","name":"在线 Excel 任务评测表","status":1,"row":84,"column":60,"config":{},"celldata":[{"r":0,"c":0,"v":{"v":"题号","m":"题号"}},{"r":0,"c":1,"v":{"v":"题目","m":"题目"}},{"r":0,"c":2,"v":{"v":"答案","m":"答案"}}]}]"""

    @Synchronized
    fun load(room: String, mapper: ObjectMapper): WorkbookDocument {
        return workbooks.findByRoomId(room) ?: workbooks.save(
            WorkbookDocument(
                roomId = room,
                snapshot = defaultSnapshot,
                updatedBy = "system"
            )
        )
    }

    @Synchronized
    fun save(room: String, user: String, ops: JsonNode, snapshot: JsonNode): WorkbookDocument {
        val doc = workbooks.findByRoomId(room) ?: WorkbookDocument(
            roomId = room,
            snapshot = snapshot.toString(),
            updatedBy = user
        )
        doc.revision++
        doc.snapshot = snapshot.toString()
        doc.updatedBy = user
        doc.updatedAt = Instant.now()
        val saved = workbooks.save(doc)

        operations.save(
            OperationLog(
                roomId = room,
                revision = saved.revision,
                username = user,
                operations = ops.toString()
            )
        )

        redis.opsForValue().set("collab:room:$room:revision", saved.revision.toString())
        return saved
    }

    fun loadYjsUpdates(room: String): List<String> {
        return operations.findByRoomIdAndKindOrderByRevisionAsc(room, YJS_UPDATE_KIND)
            .map { it.operations }
    }

    @Synchronized
    fun appendYjsUpdate(room: String, user: String, update: String): Long {
        val doc = workbooks.findByRoomId(room) ?: WorkbookDocument(
            roomId = room,
            snapshot = defaultSnapshot,
            updatedBy = user
        )
        doc.revision++
        doc.updatedBy = user
        doc.updatedAt = Instant.now()
        val saved = workbooks.save(doc)

        operations.save(
            OperationLog(
                roomId = room,
                revision = saved.revision,
                username = user,
                operations = update,
                kind = YJS_UPDATE_KIND
            )
        )
        redis.opsForValue().set("collab:room:$room:revision", saved.revision.toString())
        return saved.revision
    }

    fun ensureMember(room: String, user: String): WorkbookMember {
        return members.findByRoomIdAndUsername(room, user) ?: members.save(
            WorkbookMember(roomId = room, username = user)
        )
    }
}

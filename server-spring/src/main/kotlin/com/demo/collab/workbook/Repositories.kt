package com.demo.collab.workbook

import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository

@Repository
interface WorkbookRepository : MongoRepository<WorkbookDocument, String> {
    fun findByRoomId(roomId: String): WorkbookDocument?
}

@Repository
interface MemberRepository : MongoRepository<WorkbookMember, String> {
    fun findByRoomIdAndUsername(roomId: String, username: String): WorkbookMember?
}

@Repository
interface OperationRepository : MongoRepository<OperationLog, String> {
    fun findByRoomIdAndKindOrderByRevisionAsc(roomId: String, kind: String): List<OperationLog>
}

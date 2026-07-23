package com.demo.collab.workbook
import org.springframework.data.mongodb.repository.MongoRepository
interface WorkbookRepository:MongoRepository<WorkbookDocument,String>{fun findByRoomId(roomId:String):WorkbookDocument?}
interface MemberRepository:MongoRepository<WorkbookMember,String>{fun findByRoomIdAndUsername(roomId:String,username:String):WorkbookMember?}
interface OperationRepository:MongoRepository<OperationLog,String>

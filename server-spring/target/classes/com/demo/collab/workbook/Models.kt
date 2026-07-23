package com.demo.collab.workbook

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

@Document("collaboration_workbooks")
data class WorkbookDocument(
    @Id
    var id: String? = null,

    @Indexed(unique = true)
    var roomId: String,

    var revision: Long = 0,
    var snapshot: String,
    var updatedBy: String,
    var updatedAt: Instant = Instant.now()
)

@Document("collaboration_members")
data class WorkbookMember(
    @Id
    var id: String? = null,

    @Indexed
    var roomId: String,

    @Indexed
    var username: String,

    var role: String = "EDITOR"
)

@Document("collaboration_operations")
data class OperationLog(
    @Id
    var id: String? = null,

    @Indexed
    var roomId: String,

    var revision: Long,
    var username: String,
    var operations: String,
    var createdAt: Instant = Instant.now()
)

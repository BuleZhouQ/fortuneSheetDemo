package com.demo.collab.assessment.entity

import com.demo.collab.assessment.feo.response.CellAssessmentItem
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant

// MongoDB 数据库实体 Entity (student_submissions 集合)
@Document("student_submissions")
data class SubmissionRecordDocument(
    @Id
    val id: String? = null,

    val submissionId: String,
    val studentName: String,
    val paperId: String,
    val totalScore: Int,
    val maxScore: Int = 100,
    val results: List<CellAssessmentItem>,
    val submittedAt: Instant = Instant.now()
)

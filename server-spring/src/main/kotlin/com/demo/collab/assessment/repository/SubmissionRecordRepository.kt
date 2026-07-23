package com.demo.collab.assessment.repository

import com.demo.collab.assessment.entity.SubmissionRecordDocument
import org.springframework.data.mongodb.repository.MongoRepository
import org.springframework.stereotype.Repository

@Repository
interface SubmissionRecordRepository : MongoRepository<SubmissionRecordDocument, String> {
    fun findByStudentName(studentName: String): List<SubmissionRecordDocument>
    fun findByPaperId(paperId: String): List<SubmissionRecordDocument>
}

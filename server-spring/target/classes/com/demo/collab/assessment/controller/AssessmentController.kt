package com.demo.collab.assessment.controller

import com.demo.collab.assessment.entity.SubmissionRecordDocument
import com.demo.collab.assessment.feo.request.SubmitAssessmentRequest
import com.demo.collab.assessment.feo.response.AssessmentApiResponse
import com.demo.collab.assessment.feo.response.StandardCellRule
import com.demo.collab.assessment.feo.response.SubmitResultData
import com.demo.collab.assessment.service.AssessmentService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/assessment")
@CrossOrigin(origins = ["*"])
class AssessmentController(
    private val assessmentService: AssessmentService
) {

    @GetMapping("/paper")
    fun getPaperRules(): AssessmentApiResponse<List<StandardCellRule>> {
        return AssessmentApiResponse(
            code = 200,
            message = "获取试卷评测规则成功",
            data = assessmentService.defaultStandardRules
        )
    }

    @PostMapping("/submit")
    fun submitAssessment(
        @RequestBody request: SubmitAssessmentRequest
    ): AssessmentApiResponse<SubmitResultData> {
        val result = assessmentService.evaluateAndSave(
            studentName = request.studentName ?: "张同学",
            celldata = request.celldata
        )
        return AssessmentApiResponse(
            code = 200,
            message = "Spring Boot 评测与持久化落盘成功",
            data = result
        )
    }

    @GetMapping("/history")
    fun getHistorySubmissions(): AssessmentApiResponse<List<SubmissionRecordDocument>> {
        val history = assessmentService.getHistorySubmissions()
        return AssessmentApiResponse(
            code = 200,
            message = "获取历史评测记录成功",
            data = history
        )
    }
}

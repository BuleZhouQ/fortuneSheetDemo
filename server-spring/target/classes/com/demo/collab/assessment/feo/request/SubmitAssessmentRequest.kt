package com.demo.collab.assessment.feo.request

// 在线 Excel 任务提交请求 FEO
data class SubmitAssessmentRequest(
    val studentName: String? = "张同学",
    val celldata: List<Map<String, Any>> = emptyList()
)

package com.demo.collab.assessment.feo.response

// 单元格评测标准规则 FEO
data class StandardCellRule(
    val row: Int,
    val col: Int,
    val cellRef: String,
    val title: String,
    val scoreWeight: Int,
    val standardValue: Any,
    val standardFormula: String? = null,
    val errorAnalysisPrompt: String
)

// 逐单元格诊断结果 FEO
data class CellAssessmentItem(
    val row: Int,
    val col: Int,
    val cellRef: String,
    val title: String,
    val scoreWeight: Int,
    val earnedScore: Int,
    val isCorrect: Boolean,
    val studentValue: Any,
    val studentFormula: String? = null,
    val standardValue: Any,
    val standardFormula: String? = null,
    val errorType: String = "NONE",
    val errorAnalysisPrompt: String,
    val status: String = "UNCHECKED"
)

// 统一 API 通用响应包装 FEO
data class AssessmentApiResponse<T>(
    val code: Int = 200,
    val message: String = "Success",
    val data: T? = null
)

// 提交结果详情 FEO
data class SubmitResultData(
    val submissionId: String,
    val totalScore: Int,
    val maxScore: Int = 100,
    val results: List<CellAssessmentItem>
)

package com.demo.collab.assessment.service

import com.demo.collab.assessment.entity.SubmissionRecordDocument
import com.demo.collab.assessment.feo.response.CellAssessmentItem
import com.demo.collab.assessment.feo.response.StandardCellRule
import com.demo.collab.assessment.feo.response.SubmitResultData
import com.demo.collab.assessment.repository.SubmissionRecordRepository
import org.springframework.stereotype.Service
import kotlin.math.abs

@Service
class AssessmentService(
    private val submissionRecordRepository: SubmissionRecordRepository
) {

    val defaultStandardRules = listOf(
        StandardCellRule(
            row = 6, col = 2, cellRef = "C7",
            title = "季度销售总额求和 (SUM)",
            scoreWeight = 30,
            standardValue = 158000,
            standardFormula = "=SUM(C3:C6)",
            errorAnalysisPrompt = "求和范围选择错误或未引用正确的季度数据单元格(C3:C6)。"
        ),
        StandardCellRule(
            row = 7, col = 2, cellRef = "C8",
            title = "月度平均销售额 (AVERAGE)",
            scoreWeight = 20,
            standardValue = 39500,
            standardFormula = "=AVERAGE(C3:C6)",
            errorAnalysisPrompt = "平均值函数公式应为 =AVERAGE(C3:C6)，请检查分母或单元格区间。"
        ),
        StandardCellRule(
            row = 8, col = 2, cellRef = "C9",
            title = "应缴增值税率计算 (13%)",
            scoreWeight = 25,
            standardValue = 20540,
            standardFormula = "=C7*0.13",
            errorAnalysisPrompt = "税率计算应用总额 C7 乘以 0.13，请勿硬编码固定数值。"
        ),
        StandardCellRule(
            row = 9, col = 2, cellRef = "C10",
            title = "税后净利润占比分析",
            scoreWeight = 25,
            standardValue = "达标",
            standardFormula = "=IF(C7>100000,\"达标\",\"未达标\")",
            errorAnalysisPrompt = "逻辑判断函数应使用 IF 判断总额 C7 是否大于 100000。"
        )
    )

    private fun normalizeFormula(fmt: String?): String {
        if (fmt.isNullOrBlank()) return ""
        return fmt.replace("\\s+".toRegex(), "").uppercase()
    }

    fun evaluateAndSave(studentName: String, celldata: List<Map<String, Any>>): SubmitResultData {
        val cellMap = mutableMapOf<String, Map<String, Any>>()
        for (item in celldata) {
            val r = item["r"]
            val c = item["c"]
            if (r is Number && c is Number) {
                cellMap["${r.toInt()}_${c.toInt()}"] = item
            }
        }

        var earnedTotal = 0
        val results = mutableListOf<CellAssessmentItem>()

        for (rule in defaultStandardRules) {
            val cell = cellMap["${rule.row}_${rule.col}"]
            val cellValObj = cell?.get("v") as? Map<*, *>
            val studentVal = cellValObj?.get("v") ?: cellValObj?.get("m") ?: ""
            val studentFmt = cellValObj?.get("f") as? String ?: ""

            var isCorrect = false
            var errorType = "NONE"

            if (!rule.standardFormula.isNullOrBlank()) {
                if (studentFmt.isBlank()) {
                    errorType = "MISSING_FORMULA"
                    isCorrect = false
                } else {
                    val normStudent = normalizeFormula(studentFmt)
                    val normStandard = normalizeFormula(rule.standardFormula)
                    if (normStudent == normStandard) {
                        isCorrect = true
                    } else {
                        errorType = "FORMULA_MISMATCH"
                        isCorrect = false
                    }
                }
            } else {
                if (rule.standardValue is Number) {
                    val numVal = studentVal.toString().toDoubleOrNull()
                    val targetNum = rule.standardValue.toDouble()
                    if (numVal != null && abs(numVal - targetNum) < 0.001) {
                        isCorrect = true
                    } else {
                        errorType = "VALUE_MISMATCH"
                        isCorrect = false
                    }
                } else {
                    if (studentVal.toString().trim() == rule.standardValue.toString().trim()) {
                        isCorrect = true
                    } else {
                        errorType = "VALUE_MISMATCH"
                        isCorrect = false
                    }
                }
            }

            val itemScore = if (isCorrect) rule.scoreWeight else 0
            earnedTotal += itemScore

            results.add(
                CellAssessmentItem(
                    row = rule.row,
                    col = rule.col,
                    cellRef = rule.cellRef,
                    title = rule.title,
                    scoreWeight = rule.scoreWeight,
                    earnedScore = itemScore,
                    isCorrect = isCorrect,
                    studentValue = studentVal,
                    studentFormula = studentFmt.ifBlank { null },
                    standardValue = rule.standardValue,
                    standardFormula = rule.standardFormula,
                    errorType = if (isCorrect) "NONE" else errorType,
                    errorAnalysisPrompt = rule.errorAnalysisPrompt,
                    status = if (isCorrect) "CORRECT" else "RED_ERROR"
                )
            )
        }

        val submissionId = "sub_spring_${System.currentTimeMillis()}_${(100..999).random()}"
        val record = SubmissionRecordDocument(
            submissionId = submissionId,
            studentName = studentName,
            paperId = "paper_finance_2026",
            totalScore = earnedTotal,
            maxScore = 100,
            results = results
        )

        try {
            submissionRecordRepository.save(record)
        } catch (e: Exception) {
            println("[AssessmentService] Notice saving submission to DB: ${e.message}")
        }

        return SubmitResultData(
            submissionId = submissionId,
            totalScore = earnedTotal,
            maxScore = 100,
            results = results
        )
    }

    fun getHistorySubmissions(): List<SubmissionRecordDocument> {
        return try {
            submissionRecordRepository.findAll()
        } catch (e: Exception) {
            emptyList()
        }
    }
}

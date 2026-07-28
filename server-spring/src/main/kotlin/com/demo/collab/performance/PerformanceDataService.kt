package com.demo.collab.performance

import com.mongodb.client.model.InsertOneModel
import jakarta.annotation.PostConstruct
import org.bson.Document
import org.springframework.data.domain.PageRequest
import org.springframework.data.mongodb.core.MongoTemplate
import org.springframework.stereotype.Service

@Service
class PerformanceDataService(
    private val repository: PerformanceRowRepository,
    private val mongoTemplate: MongoTemplate
) {
    companion object {
        const val TOTAL_ROWS = 100_000
        const val COLUMN_COUNT = 20
    }

    @PostConstruct
    fun seed() {
        if (repository.count() >= TOTAL_ROWS) return
        mongoTemplate.dropCollection(PerformanceRowDocument::class.java)
        mongoTemplate.createCollection(PerformanceRowDocument::class.java)
        val collection = mongoTemplate.getCollection("performance_rows")

        for (batchStart in 0 until TOTAL_ROWS step 2_000) {
            val writes = (batchStart until minOf(batchStart + 2_000, TOTAL_ROWS)).map { row ->
                InsertOneModel(
                    Document("rowNumber", row)
                        .append("values", if (row == 0) headers() else valuesFor(row))
                )
            }
            collection.bulkWrite(writes)
        }
        collection.createIndex(Document("rowNumber", 1))
        println("[PerformanceDataService] Seeded $TOTAL_ROWS MongoDB rows")
    }

    fun rows(offset: Int, limit: Int): List<PerformanceRowDocument> =
        repository.findByRowNumberGreaterThanEqualOrderByRowNumber(
            offset.coerceIn(0, TOTAL_ROWS - 1),
            PageRequest.of(0, limit.coerceIn(1, 500))
        )

    private fun headers(): List<Any> = listOf(
        "记录编号", "名称", "部门", "分类", "数量", "单价", "金额", "日期", "状态", "负责人",
        "区域", "城市", "渠道", "优先级", "完成率", "评分", "批次", "备注", "更新时间", "校验值"
    )

    private fun valuesFor(row: Int): List<Any> {
        val quantity = 1000 + row
        val unitPrice = 10 + (row % 500) / 10.0
        return listOf(
            "ROW-${row.toString().padStart(6, '0')}", "性能测试记录 $row", "部门${row % 20}",
            "分类${row % 12}", quantity, unitPrice, quantity * unitPrice,
            "2026-${((row % 12) + 1).toString().padStart(2, '0')}-${((row % 28) + 1).toString().padStart(2, '0')}",
            if (row % 3 == 0) "完成" else "处理中", "用户${row % 100}", "区域${row % 8}",
            "城市${row % 50}", "渠道${row % 6}", row % 4, row % 101, (row % 50) / 10.0,
            "BATCH-${row % 1000}", "第 $row 行性能测试数据",
            "2026-07-27 09:${(row % 60).toString().padStart(2, '0')}", (row * 31) % 100000
        )
    }
}

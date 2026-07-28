package com.demo.collab.performance

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.index.Indexed
import org.springframework.data.mongodb.core.mapping.Document

@Document("performance_rows")
data class PerformanceRowDocument(
    @Id val id: String? = null,
    @Indexed(unique = true) val rowNumber: Int,
    val values: List<Any>
)

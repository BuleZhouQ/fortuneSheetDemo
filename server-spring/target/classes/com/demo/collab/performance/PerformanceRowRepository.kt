package com.demo.collab.performance

import org.springframework.data.domain.Pageable
import org.springframework.data.mongodb.repository.MongoRepository

interface PerformanceRowRepository : MongoRepository<PerformanceRowDocument, String> {
    fun findByRowNumberGreaterThanEqualOrderByRowNumber(rowNumber: Int, pageable: Pageable): List<PerformanceRowDocument>
}

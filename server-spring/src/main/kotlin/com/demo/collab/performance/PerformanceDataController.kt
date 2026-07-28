package com.demo.collab.performance

import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

data class PerformanceRowsResponse(
    val totalRows: Int,
    val columnCount: Int,
    val offset: Int,
    val rows: List<PerformanceRowDocument>
)

@RestController
@RequestMapping("/api/performance")
@CrossOrigin(origins = ["*"])
class PerformanceDataController(private val service: PerformanceDataService) {
    @GetMapping("/rows")
    fun rows(
        @RequestParam(defaultValue = "0") offset: Int,
        @RequestParam(defaultValue = "200") limit: Int
    ) = PerformanceRowsResponse(
        totalRows = PerformanceDataService.TOTAL_ROWS,
        columnCount = PerformanceDataService.COLUMN_COUNT,
        offset = offset,
        rows = service.rows(offset, limit)
    )
}

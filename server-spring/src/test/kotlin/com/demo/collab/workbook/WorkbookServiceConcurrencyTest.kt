package com.demo.collab.workbook

import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito
import org.springframework.data.redis.core.StringRedisTemplate
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference

class WorkbookServiceConcurrencyTest {

    @Test
    fun `creates one workbook when two clients join a new room concurrently`() {
        val workbooks = Mockito.mock(WorkbookRepository::class.java)
        val members = Mockito.mock(MemberRepository::class.java)
        val operations = Mockito.mock(OperationRepository::class.java)
        val redis = Mockito.mock(StringRedisTemplate::class.java)
        val stored = AtomicReference<WorkbookDocument?>()
        val saveCount = AtomicInteger()

        Mockito.`when`(workbooks.findByRoomId("new-room")).thenAnswer {
            val existing = stored.get()
            Thread.sleep(100)
            existing
        }
        Mockito.`when`(workbooks.save(any(WorkbookDocument::class.java))).thenAnswer {
            val document = it.getArgument<WorkbookDocument>(0)
            stored.compareAndSet(null, document)
            saveCount.incrementAndGet()
            document
        }

        val service = WorkbookService(workbooks, members, operations, redis)
        val ready = CountDownLatch(2)
        val start = CountDownLatch(1)
        val executor = Executors.newFixedThreadPool(2)
        val tasks = List(2) {
            executor.submit {
                ready.countDown()
                start.await()
                service.load("new-room", ObjectMapper())
            }
        }

        ready.await(2, TimeUnit.SECONDS)
        start.countDown()
        tasks.forEach { it.get(2, TimeUnit.SECONDS) }
        executor.shutdownNow()

        assertEquals(1, saveCount.get())
    }
}

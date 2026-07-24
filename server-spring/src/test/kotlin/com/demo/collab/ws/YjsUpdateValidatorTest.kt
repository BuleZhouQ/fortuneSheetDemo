package com.demo.collab.ws

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.util.Base64

class YjsUpdateValidatorTest {

    @Test
    fun `accepts a valid update within the size limit`() {
        val update = Base64.getEncoder().encodeToString(byteArrayOf(1, 2, 3, 4))

        assertTrue(YjsUpdateValidator.isValid(update))
    }

    @Test
    fun `rejects malformed base64`() {
        assertFalse(YjsUpdateValidator.isValid("not-base64%%%"))
    }

    @Test
    fun `rejects a decoded update larger than one mebibyte`() {
        val update = Base64.getEncoder().encodeToString(ByteArray(1024 * 1024 + 1))

        assertFalse(YjsUpdateValidator.isValid(update))
    }
}

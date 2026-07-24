package com.demo.collab.ws

import java.util.Base64

object YjsUpdateValidator {
    private const val MAX_UPDATE_BYTES = 1024 * 1024

    fun isValid(update: String): Boolean {
        return try {
            Base64.getDecoder().decode(update).size <= MAX_UPDATE_BYTES
        } catch (_: IllegalArgumentException) {
            false
        }
    }
}

package com.demo.collab.auth

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.nio.charset.StandardCharsets
import java.util.Date

@Service
class TokenService(
    @Value("\${collab.jwt-secret}") secret: String,
    @Value("\${collab.token-hours}") private val hours: Long
) {
    private val key = Keys.hmacShaKeyFor(secret.toByteArray(StandardCharsets.UTF_8))

    fun issue(username: String): String {
        return Jwts.builder()
            .subject(username)
            .claim("role", "EDITOR")
            .issuedAt(Date())
            .expiration(Date(System.currentTimeMillis() + hours * 3600000))
            .signWith(key)
            .compact()
    }

    fun username(token: String): String {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload
            .subject
    }
}

package com.demo.collab.auth

import org.springframework.web.bind.annotation.*

data class LoginResponse(
    val token: String,
    val username: String
)

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val tokens: TokenService
) {

    @PostMapping("/login")
    fun login(@RequestParam username: String): LoginResponse {
        return LoginResponse(tokens.issue(username), username)
    }
}

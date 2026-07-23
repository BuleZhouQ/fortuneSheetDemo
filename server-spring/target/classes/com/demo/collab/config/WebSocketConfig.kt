package com.demo.collab.config
import com.demo.collab.ws.CollaborationHandler
import org.springframework.context.annotation.Configuration
import org.springframework.web.socket.config.annotation.*
@Configuration @EnableWebSocket class WebSocketConfig(private val handler:CollaborationHandler):WebSocketConfigurer{override fun registerWebSocketHandlers(registry:WebSocketHandlerRegistry){registry.addHandler(handler,"/ws").setAllowedOriginPatterns("*")}}

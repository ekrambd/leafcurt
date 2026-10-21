package com.bd.fantine.feature.auth.domain.model

data class AdminSession(
    val token: String,
    val phone: String,
    val role: String = "admin",
    val isLoggedIn: Boolean = true
)

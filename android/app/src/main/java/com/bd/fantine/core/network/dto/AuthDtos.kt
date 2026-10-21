package com.bd.fantine.core.network.dto

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    @SerializedName("identifier") val identifier: String,
    @SerializedName("password") val password: String
)

data class LoginResponse(
    @SerializedName("success") val success: Boolean = false,
    @SerializedName("token") val token: String? = null,
    @SerializedName("message") val message: String? = null,
    @SerializedName("user") val user: UserDto? = null
)

data class UserDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("role") val role: String? = null
)

data class MeResponse(
    @SerializedName("success") val success: Boolean = false,
    @SerializedName("user") val user: UserDto? = null
)

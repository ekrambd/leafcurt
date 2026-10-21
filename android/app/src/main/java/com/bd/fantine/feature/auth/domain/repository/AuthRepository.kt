package com.bd.fantine.feature.auth.domain.repository

import com.bd.fantine.core.common.Resource
import com.bd.fantine.feature.auth.domain.model.AdminSession
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    fun getSessionFlow(): Flow<AdminSession?>
    suspend fun login(phone: String, pass: String): Resource<AdminSession>
    suspend fun logout(): Resource<Unit>
    fun hasValidSession(): Boolean
    fun getSavedPhone(): String?
}

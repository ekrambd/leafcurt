package com.bd.fantine.feature.dashboard.domain.repository

import com.bd.fantine.core.common.Resource
import com.bd.fantine.feature.dashboard.domain.model.AdminProduct

interface ProductRepository {
    suspend fun getProducts(forceRefresh: Boolean = false): Resource<List<AdminProduct>>
}

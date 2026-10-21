package com.bd.fantine.feature.dashboard.domain.repository

import com.bd.fantine.core.common.Resource
import com.bd.fantine.feature.dashboard.domain.model.AdminCustomer
import com.bd.fantine.feature.dashboard.domain.model.Order

interface CustomerRepository {
    suspend fun getCustomers(orders: List<Order>, forceRefresh: Boolean = false): Resource<List<AdminCustomer>>
}

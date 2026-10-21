package com.bd.fantine.core.network

import com.bd.fantine.core.network.dto.CustomerDto
import com.bd.fantine.core.network.dto.LoginRequest
import com.bd.fantine.core.network.dto.LoginResponse
import com.bd.fantine.core.network.dto.MeResponse
import com.bd.fantine.core.network.dto.OrderDto
import com.bd.fantine.core.network.dto.ProductDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface ApiService {

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("api/auth/me")
    suspend fun getMe(): Response<MeResponse>

    @GET("api/orders")
    suspend fun getOrders(): Response<List<OrderDto>>

    @PUT("api/orders/{id}")
    suspend fun updateOrderStatus(
        @Path("id") id: String,
        @Body body: Map<String, String>
    ): Response<OrderDto>

    @DELETE("api/orders/{id}")
    suspend fun deleteOrder(@Path("id") id: String): Response<Unit>

    @GET("api/products")
    suspend fun getProducts(): Response<List<ProductDto>>

    @GET("api/customers")
    suspend fun getCustomers(): Response<List<CustomerDto>>

    @POST("api/courier/pathao/dispatch")
    suspend fun dispatchPathao(@Body body: com.bd.fantine.core.network.dto.CourierDispatchRequest): Response<com.bd.fantine.core.network.dto.CourierDispatchResponse>

    @POST("api/courier/steadfast/dispatch")
    suspend fun dispatchSteadfast(@Body body: com.bd.fantine.core.network.dto.CourierDispatchRequest): Response<com.bd.fantine.core.network.dto.CourierDispatchResponse>

    @GET("api/courier/steadfast/fraud-check/{phone}")
    suspend fun checkSteadfastFraud(@Path("phone") phone: String): Response<com.bd.fantine.core.network.dto.FraudCheckResponse>
}


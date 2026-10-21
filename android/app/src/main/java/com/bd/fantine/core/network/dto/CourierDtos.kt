package com.bd.fantine.core.network.dto

import com.google.gson.annotations.SerializedName

data class CourierDispatchRequest(
    @SerializedName("order") val order: Map<String, Any?>,
    @SerializedName("storeId") val storeId: Long? = null,
    @SerializedName("itemWeight") val itemWeight: Double = 0.5,
    @SerializedName("itemQuantity") val itemQuantity: Int = 1,
    @SerializedName("specialInstruction") val specialInstruction: String? = null
)

data class CourierDispatchResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("trackingCode") val trackingCode: String? = null,
    @SerializedName("consignmentId") val consignmentId: String? = null,
    @SerializedName("message") val message: String? = null,
    @SerializedName("orderStatus") val orderStatus: String? = null,
    @SerializedName("deliveryFee") val deliveryFee: Double? = null,
    @SerializedName("error") val error: String? = null
)

data class FraudCheckResponse(
    @SerializedName("success") val success: Boolean = false,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("totalParcels") val totalParcels: Int? = null,
    @SerializedName("deliveredParcels") val deliveredParcels: Int? = null,
    @SerializedName("returnedParcels") val returnedParcels: Int? = null,
    @SerializedName("cancelledParcels") val cancelledParcels: Int? = null,
    @SerializedName("successRatio") val successRatio: Double? = null,
    @SerializedName("message") val message: String? = null
)

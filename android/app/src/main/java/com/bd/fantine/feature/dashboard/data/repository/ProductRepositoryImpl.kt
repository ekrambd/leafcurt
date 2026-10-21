package com.bd.fantine.feature.dashboard.data.repository

import com.bd.fantine.core.common.Resource
import com.bd.fantine.core.network.ApiService
import com.bd.fantine.core.network.dto.ProductDto
import com.bd.fantine.feature.dashboard.domain.model.AdminProduct
import com.bd.fantine.feature.dashboard.domain.repository.ProductRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ProductRepositoryImpl(
    private val apiService: ApiService
) : ProductRepository {

    private var cachedProducts: List<AdminProduct>? = null

    override suspend fun getProducts(forceRefresh: Boolean): Resource<List<AdminProduct>> = withContext(Dispatchers.IO) {
        if (!forceRefresh && cachedProducts != null) {
            return@withContext Resource.Success(cachedProducts!!)
        }

        try {
            val response = apiService.getProducts()
            if (response.isSuccessful && response.body() != null) {
                val dtoList = response.body()!!
                val products = dtoList.map { dto -> mapToAdminProduct(dto) }
                cachedProducts = products
                Resource.Success(products)
            } else {
                Resource.Error("Failed to fetch products: ${response.code()} ${response.message()}")
            }
        } catch (e: Exception) {
            cachedProducts?.let { return@withContext Resource.Success(it) }
            Resource.Error(e.message ?: "Failed to load products", e)
        }
    }

    private fun mapToAdminProduct(dto: ProductDto): AdminProduct {
        val stockVal = dto.stockQuantity ?: dto.stock ?: 0
        val img = dto.coverImage ?: dto.image ?: ""
        return AdminProduct(
            id = dto.id,
            title = dto.title ?: "Untitled Product",
            price = dto.price ?: 0.0,
            regularPrice = dto.regularPrice ?: dto.price ?: 0.0,
            costPrice = dto.costPrice ?: 0.0,
            stock = stockVal,
            category = dto.category ?: "General",
            series = dto.series ?: "",
            brand = dto.brand ?: "FAИTIИE Korea",
            image = img,
            description = dto.description ?: "",
            isAvailable = dto.isAvailable ?: (stockVal > 0),
            sku = dto.sku ?: dto.id
        )
    }
}

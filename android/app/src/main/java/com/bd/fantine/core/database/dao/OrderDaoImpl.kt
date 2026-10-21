package com.bd.fantine.core.database.dao

import android.content.ContentValues
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import com.bd.fantine.core.database.entity.OrderEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext

class OrderDaoImpl(private val dbHelper: () -> SQLiteDatabase) : OrderDao {

    private val ordersFlow = MutableStateFlow<List<OrderEntity>>(emptyList())

    init {
        refreshFlow()
    }

    private fun refreshFlow() {
        try {
            val list = loadAllFromDb()
            ordersFlow.value = list
        } catch (e: Exception) {
            // non-blocking
        }
    }

    private fun loadAllFromDb(): List<OrderEntity> {
        val db = dbHelper()
        val list = mutableListOf<OrderEntity>()
        val cursor = db.query(
            "orders",
            null,
            null,
            null,
            null,
            null,
            "createdAt DESC"
        )
        cursor.use {
            while (it.moveToNext()) {
                list.add(cursorToEntity(it))
            }
        }
        return list
    }

    private fun cursorToEntity(c: Cursor): OrderEntity {
        val courierIdx = c.getColumnIndex("courierProvider")
        val trackIdx = c.getColumnIndex("trackingCode")
        return OrderEntity(
            id = c.getString(c.getColumnIndexOrThrow("id")),
            customerName = c.getString(c.getColumnIndexOrThrow("customerName")),
            phone = c.getString(c.getColumnIndexOrThrow("phone")),
            address = c.getString(c.getColumnIndexOrThrow("address")),
            district = c.getString(c.getColumnIndexOrThrow("district")),
            totalAmount = c.getDouble(c.getColumnIndexOrThrow("totalAmount")),
            deliveryCharge = c.getDouble(c.getColumnIndexOrThrow("deliveryCharge")),
            paymentMethod = c.getString(c.getColumnIndexOrThrow("paymentMethod")),
            status = c.getString(c.getColumnIndexOrThrow("status")),
            createdAt = c.getString(c.getColumnIndexOrThrow("createdAt")),
            itemsSummary = c.getString(c.getColumnIndexOrThrow("itemsSummary")),
            notes = c.getString(c.getColumnIndexOrThrow("notes")),
            courierProvider = if (courierIdx >= 0 && !c.isNull(courierIdx)) c.getString(courierIdx) else "",
            trackingCode = if (trackIdx >= 0 && !c.isNull(trackIdx)) c.getString(trackIdx) else ""
        )
    }

    override fun observeOrders(): Flow<List<OrderEntity>> = ordersFlow.asStateFlow()

    override suspend fun getOrderById(id: String): OrderEntity? = withContext(Dispatchers.IO) {
        val db = dbHelper()
        val cursor = db.query("orders", null, "id = ?", arrayOf(id), null, null, null, "1")
        cursor.use {
            if (it.moveToFirst()) cursorToEntity(it) else null
        }
    }

    override suspend fun getAllOrderIds(): List<String> = withContext(Dispatchers.IO) {
        val db = dbHelper()
        val list = mutableListOf<String>()
        val cursor = db.query("orders", arrayOf("id"), null, null, null, null, null)
        cursor.use {
            val idx = it.getColumnIndexOrThrow("id")
            while (it.moveToNext()) {
                list.add(it.getString(idx))
            }
        }
        list
    }

    override suspend fun insertOrders(orders: List<OrderEntity>) = withContext(Dispatchers.IO) {
        val db = dbHelper()
        db.beginTransaction()
        try {
            for (order in orders) {
                val cv = entityToContentValues(order)
                db.insertWithOnConflict("orders", null, cv, SQLiteDatabase.CONFLICT_REPLACE)
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
        refreshFlow()
    }

    override suspend fun insertOrder(order: OrderEntity) = withContext(Dispatchers.IO) {
        val db = dbHelper()
        val cv = entityToContentValues(order)
        db.insertWithOnConflict("orders", null, cv, SQLiteDatabase.CONFLICT_REPLACE)
        refreshFlow()
    }

    override suspend fun updateOrder(order: OrderEntity) = withContext(Dispatchers.IO) {
        insertOrder(order)
    }

    override suspend fun updateStatus(id: String, status: String) = withContext(Dispatchers.IO) {
        val db = dbHelper()
        val cv = ContentValues().apply { put("status", status) }
        db.update("orders", cv, "id = ?", arrayOf(id))
        refreshFlow()
    }

    override suspend fun updateCourierInfo(id: String, courierProvider: String, trackingCode: String, status: String) = withContext(Dispatchers.IO) {
        val db = dbHelper()
        val cv = ContentValues().apply {
            put("courierProvider", courierProvider)
            put("trackingCode", trackingCode)
            put("status", status)
        }
        db.update("orders", cv, "id = ?", arrayOf(id))
        refreshFlow()
    }

    override suspend fun deleteById(id: String) = withContext(Dispatchers.IO) {
        val db = dbHelper()
        db.delete("orders", "id = ?", arrayOf(id))
        refreshFlow()
    }

    override suspend fun clearAll() = withContext(Dispatchers.IO) {
        val db = dbHelper()
        db.delete("orders", null, null)
        refreshFlow()
    }

    override suspend fun replaceAll(orders: List<OrderEntity>) = withContext(Dispatchers.IO) {
        val db = dbHelper()
        db.beginTransaction()
        try {
            db.delete("orders", null, null)
            for (order in orders) {
                val cv = entityToContentValues(order)
                db.insertWithOnConflict("orders", null, cv, SQLiteDatabase.CONFLICT_REPLACE)
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
        refreshFlow()
    }

    private fun entityToContentValues(e: OrderEntity): ContentValues {
        return ContentValues().apply {
            put("id", e.id)
            put("customerName", e.customerName)
            put("phone", e.phone)
            put("address", e.address)
            put("district", e.district)
            put("totalAmount", e.totalAmount)
            put("deliveryCharge", e.deliveryCharge)
            put("paymentMethod", e.paymentMethod)
            put("status", e.status)
            put("createdAt", e.createdAt)
            put("itemsSummary", e.itemsSummary)
            put("notes", e.notes)
            put("courierProvider", e.courierProvider)
            put("trackingCode", e.trackingCode)
        }
    }
}

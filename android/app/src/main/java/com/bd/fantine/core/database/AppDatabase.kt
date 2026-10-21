package com.bd.fantine.core.database

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.bd.fantine.core.database.dao.OrderDao
import com.bd.fantine.core.database.dao.OrderDaoImpl

class AppDatabase private constructor(context: Context) : SQLiteOpenHelper(
    context.applicationContext,
    DATABASE_NAME,
    null,
    DATABASE_VERSION
) {

    private val orderDaoInstance: OrderDao by lazy {
        OrderDaoImpl { writableDatabase }
    }

    fun orderDao(): OrderDao = orderDaoInstance

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY NOT NULL,
                customerName TEXT NOT NULL,
                phone TEXT NOT NULL,
                address TEXT NOT NULL,
                district TEXT NOT NULL,
                totalAmount REAL NOT NULL,
                deliveryCharge REAL NOT NULL,
                paymentMethod TEXT NOT NULL,
                status TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                itemsSummary TEXT NOT NULL,
                notes TEXT NOT NULL,
                courierProvider TEXT DEFAULT '',
                trackingCode TEXT DEFAULT ''
            )
            """.trimIndent()
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        if (oldVersion < 2) {
            try {
                db.execSQL("ALTER TABLE orders ADD COLUMN courierProvider TEXT DEFAULT ''")
                db.execSQL("ALTER TABLE orders ADD COLUMN trackingCode TEXT DEFAULT ''")
            } catch (e: Exception) {
                db.execSQL("DROP TABLE IF EXISTS orders")
                onCreate(db)
            }
        }
    }

    companion object {
        private const val DATABASE_NAME = "fantine_admin.db"
        private const val DATABASE_VERSION = 2

        @Volatile
        private var instance: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return instance ?: synchronized(this) {
                instance ?: AppDatabase(context).also { instance = it }
            }
        }
    }
}

#!/usr/bin/env node
import { Client } from 'pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    console.error('❌ DATABASE_URL not set')
    process.exit(1)
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
})

async function main() {
    try {
        await client.connect()
        console.log('✅ Connected to database')

        // Create tables
        const createTablesSql = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT NOT NULL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        "emailVerified" TIMESTAMP,
        password TEXT,
        name TEXT,
        image TEXT,
        role TEXT NOT NULL DEFAULT 'CUSTOMER',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT NOT NULL PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(provider, provider_account_id)
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT NOT NULL PRIMARY KEY,
        "sessionToken" TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL,
        expires TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS verificationtokens (
        email TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMP NOT NULL,
        PRIMARY KEY (email, token)
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT NOT NULL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        image TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT NOT NULL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        price DECIMAL(15,2) NOT NULL,
        category_id TEXT NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS product_images (
        id TEXT NOT NULL PRIMARY KEY,
        product_id TEXT NOT NULL,
        url TEXT NOT NULL,
        "isMain" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS product_variants (
        id TEXT NOT NULL PRIMARY KEY,
        product_id TEXT NOT NULL,
        size TEXT NOT NULL,
        color TEXT,
        stock INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT NOT NULL PRIMARY KEY,
        user_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        size TEXT,
        color TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT NOT NULL PRIMARY KEY,
        user_id TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        "totalAmount" DECIMAL(15,2) NOT NULL,
        "shippingAddress" TEXT NOT NULL,
        "trackingNumber" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT NOT NULL PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(15,2) NOT NULL,
        size TEXT,
        color TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS addresses (
        id TEXT NOT NULL PRIMARY KEY,
        user_id TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        "postalCode" TEXT NOT NULL,
        country TEXT NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT NOT NULL PRIMARY KEY,
        product_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS hero_slides (
        id TEXT NOT NULL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        image TEXT NOT NULL,
        "ctaText" TEXT,
        "ctaLink" TEXT,
        "displayOrder" INTEGER NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        email TEXT NOT NULL PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        expires TIMESTAMP NOT NULL
      );
    `

        for (const sql of createTablesSql.split(';').filter(s => s.trim())) {
            if (sql.trim()) {
                await client.query(sql.trim())
            }
        }
        console.log('✅ Tables created')

        // Create admin user
        const email = 'admin@zikiapparel.com'
        const password = 'admin123'
        const hashedPassword = await bcrypt.hash(password, 12)

        await client.query(
            `INSERT INTO users (id, email, password, role, name, "createdAt", "updatedAt") 
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
             ON CONFLICT (email) DO UPDATE SET password = $3
            `,
            ['admin-' + Date.now(), email, hashedPassword, 'ADMIN', 'Admin User']
        )

        console.log('✅ Admin user created:', email)
    } catch (error) {
        console.error('❌ Error:', error)
        process.exit(1)
    } finally {
        await client.end()
    }
}

main()

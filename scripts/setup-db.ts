#!/usr/bin/env node
const { Client } = require('pg')
const bcrypt = require('bcryptjs')

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
      CREATE TABLE IF NOT EXISTS "User" (
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

      CREATE TABLE IF NOT EXISTS "Account" (
        id TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
        UNIQUE(provider, "providerAccountId")
      );

      CREATE TABLE IF NOT EXISTS "Session" (
        id TEXT NOT NULL PRIMARY KEY,
        "sessionToken" TEXT NOT NULL UNIQUE,
        "userId" TEXT NOT NULL,
        expires TIMESTAMP NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        email TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMP NOT NULL,
        PRIMARY KEY (email, token)
      );

      CREATE TABLE IF NOT EXISTS "Category" (
        id TEXT NOT NULL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        image TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Product" (
        id TEXT NOT NULL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        price DECIMAL(15,2) NOT NULL,
        "categoryId" TEXT NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("categoryId") REFERENCES "Category"(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "ProductImage" (
        id TEXT NOT NULL PRIMARY KEY,
        "productId" TEXT NOT NULL,
        url TEXT NOT NULL,
        "isMain" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "ProductVariant" (
        id TEXT NOT NULL PRIMARY KEY,
        "productId" TEXT NOT NULL,
        size TEXT NOT NULL,
        color TEXT,
        stock INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "CartItem" (
        id TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        size TEXT,
        color TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
        FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "Order" (
        id TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        "totalAmount" DECIMAL(15,2) NOT NULL,
        "shippingAddress" TEXT NOT NULL,
        "trackingNumber" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"(id)
      );

      CREATE TABLE IF NOT EXISTS "OrderItem" (
        id TEXT NOT NULL PRIMARY KEY,
        "orderId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(15,2) NOT NULL,
        size TEXT,
        color TEXT,
        FOREIGN KEY ("orderId") REFERENCES "Order"(id) ON DELETE CASCADE,
        FOREIGN KEY ("productId") REFERENCES "Product"(id)
      );

      CREATE TABLE IF NOT EXISTS "Address" (
        id TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        "postalCode" TEXT NOT NULL,
        country TEXT NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "Review" (
        id TEXT NOT NULL PRIMARY KEY,
        "productId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE CASCADE,
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "HeroSlide" (
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

      CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
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
      `INSERT INTO "User" (id, email, password, role, name, "createdAt", "updatedAt") 
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

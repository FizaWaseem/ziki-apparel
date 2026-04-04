/*
  Warnings:

  - You are about to drop the column `total` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `billing_address_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `shipping_address_id` on the `orders` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "hero_slides" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'image',
    "src" TEXT NOT NULL,
    "poster" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "ctaText" TEXT NOT NULL DEFAULT 'Shop Now',
    "ctaLink" TEXT NOT NULL DEFAULT '/products',
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_order_items" ("id", "order_id", "price", "product_id", "quantity", "variant_id") SELECT "id", "order_id", "price", "product_id", "quantity", "variant_id" FROM "order_items";
DROP TABLE "order_items";
ALTER TABLE "new_order_items" RENAME TO "order_items";
CREATE TABLE "new_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "total" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "shipping" REAL NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "stripe_payment_intent_id" TEXT,
    "shipping_address" JSONB,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_orders" ("createdAt", "id", "notes", "orderNumber", "paymentMethod", "paymentStatus", "shipping", "status", "stripe_payment_intent_id", "subtotal", "tax", "total", "updatedAt", "user_id") SELECT "createdAt", "id", "notes", "orderNumber", "paymentMethod", "paymentStatus", "shipping", "status", "stripe_payment_intent_id", "subtotal", "tax", "total", "updatedAt", "user_id" FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

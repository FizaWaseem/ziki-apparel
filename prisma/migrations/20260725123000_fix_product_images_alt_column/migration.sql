-- Ensure product_images has the alt column expected by Prisma model
ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "alt" TEXT;

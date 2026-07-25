import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  slug: z.string().min(1, 'Product slug is required').optional(),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED']).optional(),
  featured: z.boolean().optional(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  sizeChartImage: z.string().optional(),
  images: z.array(z.object({
    url: z.string(),
    alt: z.string(),
    position: z.number(),
  })).optional(),
  variants: z.array(z.object({
    size: z.string(),
    color: z.string(),
    stock: z.number().min(0),
    price: z.number().min(0),
  })).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  if (req.method === 'GET') {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            select: {
              id: true,
              url: true,
            },
          },
          variants: true,
        },
      });

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      return res.status(200).json({
        ...product,
        images: product.images.map((image, index) => ({
          ...image,
          position: index,
        })),
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const validation = updateProductSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: 'Invalid product data',
          errors: validation.error.issues,
        });
      }

      const { name, slug, description, price, status, featured, categoryId, sizeChartImage, images, variants } = validation.data;

      if (categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
          select: { id: true },
        });

        if (!category) {
          return res.status(400).json({ message: 'Selected category does not exist' });
        }
      }

      const normalizedVariants = (variants || [])
        .map((variant) => ({
          ...variant,
          size: variant.size.trim(),
          color: variant.color.trim(),
        }))
        .filter((variant) => variant.size.length > 0);

      const variantKeys = new Set<string>();
      for (const variant of normalizedVariants) {
        const key = `${variant.size.toLowerCase()}::${variant.color.toLowerCase()}`;
        if (variantKeys.has(key)) {
          return res.status(400).json({
            message: `Duplicate variant detected for size "${variant.size}" and color "${variant.color || 'N/A'}"`,
          });
        }
        variantKeys.add(key);
      }

      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Check if slug is unique (if being updated)
      if (slug && slug !== existingProduct.slug) {
        const slugExists = await prisma.product.findUnique({
          where: { slug },
        });

        if (slugExists) {
          return res.status(400).json({ message: 'Product slug already exists' });
        }
      }

      // Update product with transaction
      const product = await prisma.$transaction(async (tx) => {
        // Update the product
        await tx.product.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(slug && { slug }),
            ...(description !== undefined && { description }),
            ...(price !== undefined && { price }),
            ...(status && { status }),
            ...(featured !== undefined && { featured }),
            ...(categoryId && { categoryId }),
            ...(sizeChartImage !== undefined && { sizeChartImage: sizeChartImage || null }),
          },
        });

        // Update images if provided
        if (images) {
          // Delete existing images
          await tx.productImage.deleteMany({
            where: { productId: id },
          });

          // Create new images
          if (images.length > 0) {
            const imageValues = images.map((img) =>
              Prisma.sql`(${randomUUID()}, ${img.url}, ${id})`
            );

            await tx.$executeRaw(
              Prisma.sql`
                INSERT INTO "product_images" ("id", "url", "product_id")
                VALUES ${Prisma.join(imageValues)}
              `
            );
          }
        }

        // Update variants if provided
        if (variants) {
          // Delete existing variants
          await tx.productVariant.deleteMany({
            where: { productId: id },
          });

          // Create new variants
          if (normalizedVariants.length > 0) {
            await tx.productVariant.createMany({
              data: normalizedVariants.map(variant => ({
                productId: id,
                size: variant.size,
                color: variant.color || null,
                stock: variant.stock,
                price: variant.price,
              })),
            });
          }
        }

        // Return complete product
        return await tx.product.findUnique({
          where: { id },
          include: {
            category: true,
            images: {
              select: {
                id: true,
                url: true,
              },
            },
            variants: true,
          },
        });
      });

      return res.status(200).json(
        product
          ? {
              ...product,
              images: product.images.map((image, index) => ({
                ...image,
                position: index,
              })),
            }
          : product
      );
    } catch (error) {
      console.error('Error updating product:', error);

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return res.status(400).json({ message: 'Duplicate value conflict (slug, SKU, or variant combination already exists)' });
        }

        if (error.code === 'P2003') {
          return res.status(400).json({ message: 'Invalid relation data (category, product, or variant reference failed)' });
        }
      }

      const message = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({ message: 'Internal server error', details: message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Delete product with transaction (cascade delete will handle related records)
      await prisma.$transaction(async (tx) => {
        // Delete related records first (in order of dependencies)
        await tx.orderItem.deleteMany({
          where: { productId: id },
        });

        await tx.review.deleteMany({
          where: { productId: id },
        });

        await tx.cartItem.deleteMany({
          where: { productId: id },
        });

        await tx.productImage.deleteMany({
          where: { productId: id },
        });

        await tx.productVariant.deleteMany({
          where: { productId: id },
        });

        // Delete the product
        await tx.product.delete({
          where: { id },
        });
      });

      return res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
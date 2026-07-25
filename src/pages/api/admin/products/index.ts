import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Product slug is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED']),
  featured: z.boolean().optional(),
  categoryId: z.string().min(1, 'Category is required'),
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

  if (req.method === 'GET') {
    try {
      const products = await prisma.product.findMany({
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
              position: true,
            },
            orderBy: { position: 'asc' },
          },
          variants: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const validation = createProductSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: 'Invalid product data',
          errors: validation.error.issues,
        });
      }

      const { name, slug, description, price, status, featured, categoryId, sizeChartImage, images, variants } = validation.data;

      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });

      if (!category) {
        return res.status(400).json({ message: 'Selected category does not exist' });
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

      // Check if slug is unique
      const existingProduct = await prisma.product.findUnique({
        where: { slug },
      });

      if (existingProduct) {
        return res.status(400).json({ message: 'Product slug already exists' });
      }

      // Create product with transaction
      const product = await prisma.$transaction(async (tx) => {
        // Create the product
        const newProduct = await tx.product.create({
          data: {
            name,
            slug,
            description: description || '',
            price,
            status,
            featured: featured || false,
            categoryId,
            sizeChartImage: sizeChartImage || null,
          },
        });

        // Create images if provided
        if (images && images.length > 0) {
          await tx.productImage.createMany({
            data: images.map(img => ({
              productId: newProduct.id,
              url: img.url,
              position: img.position,
            })),
          });
        }

        // Create variants if provided
        if (normalizedVariants.length > 0) {
          await tx.productVariant.createMany({
            data: normalizedVariants.map(variant => ({
              productId: newProduct.id,
              size: variant.size,
              color: variant.color || null,
              stock: variant.stock,
              price: variant.price,
            })),
          });
        }

        // Return complete product
        return await tx.product.findUnique({
          where: { id: newProduct.id },
          include: {
            category: true,
            images: {
              select: {
                id: true,
                url: true,
                position: true,
              },
              orderBy: { position: 'asc' },
            },
            variants: true,
          },
        });
      });

      return res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);

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

  return res.status(405).json({ message: 'Method not allowed' });
}
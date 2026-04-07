import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
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
              alt: img.alt,
              position: img.position,
            })),
          });
        }

        // Create variants if provided
        if (variants && variants.length > 0) {
          await tx.productVariant.createMany({
            data: variants.map(variant => ({
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
            images: { orderBy: { position: 'asc' } },
            variants: true,
          },
        });
      });

      return res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
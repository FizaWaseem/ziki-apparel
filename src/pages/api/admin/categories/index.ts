import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Category slug is required'),
  description: z.string().optional(),
  image: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      const categoriesWithCount = categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        productCount: category._count.products,
        createdAt: category.createdAt.toISOString(),
      }));

      return res.status(200).json(categoriesWithCount);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const validation = createCategorySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: 'Invalid category data',
          errors: validation.error.issues,
        });
      }

      const { name, slug, description, image } = validation.data;

      // Check if slug is unique
      const existingCategory = await prisma.category.findUnique({
        where: { slug },
      });

      if (existingCategory) {
        return res.status(400).json({ message: 'Category slug already exists' });
      }

      const category = await prisma.category.create({
        data: {
          name,
          slug,
          description: description || '',
          image: image || null,
        },
      });

      return res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
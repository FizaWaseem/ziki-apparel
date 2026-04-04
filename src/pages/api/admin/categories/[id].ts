import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCategorySchema = z.object({
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

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid category ID' });
  }

  if (req.method === 'PUT') {
    try {
      const validation = updateCategorySchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: 'Invalid category data',
          errors: validation.error.issues,
        });
      }

      const { name, slug, description, image } = validation.data;

      // Check if slug is unique (excluding current category)
      const existingCategory = await prisma.category.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (existingCategory) {
        return res.status(400).json({ message: 'Category slug already exists' });
      }

      const category = await prisma.category.update({
        where: { id },
        data: {
          name,
          slug,
          description: description || '',
          ...(image && { image }),
        },
      });

      return res.status(200).json(category);
    } catch (error: unknown) {
      console.error('Error updating category:', error);
      
      if ((error as { code?: string })?.code === 'P2025') {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Check if category has products
      const categoryWithProducts = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });

      if (!categoryWithProducts) {
        return res.status(404).json({ message: 'Category not found' });
      }

      if (categoryWithProducts._count.products > 0) {
        return res.status(400).json({
          message: `Cannot delete category. It has ${categoryWithProducts._count.products} products associated with it.`,
        });
      }

      await prisma.category.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      
      if ((error as { code?: string })?.code === 'P2025') {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
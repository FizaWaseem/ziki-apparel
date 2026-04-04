import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = formidable({
      uploadDir: './public/uploads',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const [fields, files] = await form.parse(req);
    
    const file = Array.isArray(files.image) ? files.image[0] : files.image;
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      // Delete the uploaded file
      fs.unlinkSync(file.filepath);
      return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.originalFilename || '');
    const filename = `product-${timestamp}${extension}`;
    const newPath = path.join(uploadsDir, filename);

    // Move file to final location
    fs.renameSync(file.filepath, newPath);

    // Return the URL
    const url = `/uploads/${filename}`;

    return res.status(200).json({
      url,
      filename,
      size: file.size,
      type: file.mimetype,
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ message: 'Error uploading file' });
  }
}
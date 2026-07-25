import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication: Either NextAuth session OR Bearer token
  const session = await getServerSession(req, res, authOptions);
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  // Verify authentication
  const isAuthenticatedViaSession = session?.user?.role === 'ADMIN';
  const isAuthenticatedViaToken = bearerToken === process.env.ADMIN_API_TOKEN;
  
  if (!isAuthenticatedViaSession && !isAuthenticatedViaToken) {
    return res.status(401).json({ 
      message: 'Unauthorized - Please provide valid session or Bearer token',
      hint: 'Use Bearer token: Authorization: Bearer YOUR_ADMIN_API_TOKEN' 
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let tempFilePath: string | null = null;

  try {
    // Check Vercel Blob configuration
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        message: 'Vercel Blob storage not configured. Add BLOB_READ_WRITE_TOKEN to environment variables.',
      });
    }

    const form = formidable({
      uploadDir: './public/uploads',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    // Create temp directory if needed
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
      fs.unlinkSync(file.filepath);
      return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' });
    }

    tempFilePath = file.filepath;

    // Read file from temp location
    const fileBuffer = fs.readFileSync(tempFilePath);

    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.originalFilename || '');
    const randomString = Math.random().toString(36).substring(2, 8);
    const filename = `product-${timestamp}-${randomString}${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      contentType: file.mimetype || 'image/jpeg',
    });

    const url = blob.url;

    if (!url) {
      return res.status(500).json({ message: 'Failed to generate public URL' });
    }

    return res.status(200).json({
      message: 'Image uploaded successfully',
      url,
      filename,
      size: file.size,
      type: file.mimetype,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      message: 'Error uploading file',
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  } finally {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}
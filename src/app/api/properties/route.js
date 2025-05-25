import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Helper function to handle file uploads
async function uploadImages(imageFiles) {
  const uploadDir = path.join(process.cwd(), 'public', 'property');
  await fs.mkdir(uploadDir, { recursive: true });

  const uploadedUrls = [];

  for (const file of imageFiles) {
    const ext = path.extname(file.name);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Convert base64 to buffer and write to file
    const fileBuffer = Buffer.from(file.data.split(',')[1], 'base64');
    await fs.writeFile(filePath, fileBuffer);

    uploadedUrls.push(`/property/${filename}`);
  }

  return uploadedUrls;
}

export async function POST(req) {
  const cookieStore = await cookies(); // ✅ await added
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const formData = await req.json();

    const { title, location, price, availability, amenities, images: imageFiles } = formData;

    // Upload images if they exist
    let imageUrls = [];
    if (imageFiles && imageFiles.length > 0) {
      imageUrls = await uploadImages(imageFiles);
    }

    const newProperty = await prisma.property.create({
      data: {
        title,
        location,
        price: parseFloat(price),
        availability: availability || 'Available',
        amenities: Array.isArray(amenities) ? amenities : [],
        images: imageUrls,
        ownerId: decoded.userId,
      },
    });

    return NextResponse.json(newProperty);
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      { message: 'Invalid token or creation failed', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const { searchParams } = new URL(req.url);

  try {
    if (token) {
      // Authenticated request (owner dashboard)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const properties = await prisma.property.findMany({
        where: { ownerId: decoded.userId },
      });
      return NextResponse.json(properties);
    } else {
      // Public request (tenant dashboard)
      const minPrice = searchParams.get('minPrice');
      const maxPrice = searchParams.get('maxPrice');
      const location = searchParams.get('location');
      const amenities = searchParams.getAll('amenities');

      // Build filter for available properties
      const where = {
        availability: 'Available'
      };

      // Add price range filter if provided
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice);
        if (maxPrice) where.price.lte = parseFloat(maxPrice);
      }

      // Add location filter if provided
      if (location) {
        where.location = {
          contains: location,
          mode: 'insensitive',
        };
      }

      // Add amenities filter if provided
      if (amenities.length > 0) {
        where.amenities = {
          hasSome: amenities,
        };
      }

      const availableProperties = await prisma.property.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(availableProperties);
    }
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { message: 'Invalid token or retrieval failed', error: error.message },
      { status: 500 }
    );
  }
}
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { title, location, price, availability, amenities, images } = await req.json();

    const newProperty = await prisma.property.create({
      data: {
        title,
        location,
        price,
        availability,
        amenities,
        images,
        ownerId: decoded.userId,
      },
    });

    return NextResponse.json(newProperty);
  } catch (error) {
    return NextResponse.json({ message: 'Invalid token or creation failed' }, { status: 401 });
  }
}

export async function GET(req) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const properties = await prisma.property.findMany({
        where: { ownerId: decoded.userId },
      });
      return NextResponse.json(properties);
    } else {
      // Return public properties or an empty array
      const publicProperties = await prisma.property.findMany({
        where: { isPublic: true }, // only if such a field exists
        take: 10,
      });
      return NextResponse.json(publicProperties);
    }
  } catch (error) {
    return NextResponse.json({ message: 'Invalid token or retrieval failed' }, { status: 401 });
  }
}

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PUT(req, { params }) {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = params;
    const { title, location, price, availability, amenities, images } = await req.json();

    const property = await prisma.property.findUnique({
      where: { id }, // ✅ Use id directly as it's a string (ObjectId)
    });

    if (!property || property.ownerId !== decoded.userId) {
      return NextResponse.json({ message: 'Property not found or access denied' }, { status: 404 });
    }

    const updated = await prisma.property.update({
      where: { id },
      data: { title, location, price, availability, amenities, images },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ message: 'Invalid token or update failed' }, { status: 401 });
  }
}

export async function DELETE(req, { params }) {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = params;

    const property = await prisma.property.findUnique({
      where: { id }, // ✅ Use id as string
    });

    if (!property || property.ownerId !== decoded.userId) {
      return NextResponse.json({ message: 'Property not found or access denied' }, { status: 404 });
    }

    await prisma.property.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ message: 'Invalid token or deletion failed' }, { status: 401 });
  }
}

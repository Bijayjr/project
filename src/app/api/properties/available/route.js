// app/api/properties/available/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Named export of PrismaClient instance

export async function GET() {
  try {
    const availableProperties = await prisma.property.findMany({
      where: {
        availability: 'Available',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(availableProperties);
  } catch (error) {
    console.error('Error fetching available properties:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req) {
  const { name, email, password, role } = await req.json();

  // Validate inputs
  if (!name || !email || !password || !role) {
    return new Response(
      JSON.stringify({ message: 'All fields (name, email, password, role) are required' }),
      { status: 400 }
    );
  }

  if (!['TENANT', 'OWNER'].includes(role.toUpperCase())) {
    return new Response(
      JSON.stringify({ message: 'Invalid role. Must be TENANT or OWNER.' }),
      { status: 400 }
    );
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role.toUpperCase(), // Prisma expects enum as uppercase string
      },
    });

    return new Response(
      JSON.stringify({ message: 'Registration successful', user }),
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    if (error.code === 'P2002') {
      // Prisma unique constraint violation
      return new Response(
        JSON.stringify({ message: 'Email already exists' }),
        { status: 409 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Error registering user' }),
      { status: 500 }
    );
  }
}

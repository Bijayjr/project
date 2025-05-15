import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(req) {
  const body = await req.json()
  const { email, password } = body

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return NextResponse.json({ message: 'Invalid email or password' }, { status: 400 })
  }

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    return NextResponse.json({ message: 'Invalid email or password' }, { status: 400 })
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' })

  const response = NextResponse.json({
    message: 'Login successful',
    user: {
      id: user.id,
      role: user.role, // <-- Send the role
      email: user.email,
      name: user.name,
    },
  })

  response.cookies.set({
    name: 'token',
    value: token,
    httpOnly: true,
    maxAge: 86400,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}

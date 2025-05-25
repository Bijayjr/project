import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' });

  // Clear the token cookie with proper settings
  response.cookies.set({
    name: 'token',
    value: '',
    expires: new Date(0),
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}

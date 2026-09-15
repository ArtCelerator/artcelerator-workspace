import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter")
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: ((parsed.error as any).errors)[0].message }, { status: 400 });
    }
    
    const { name, email, password } = parsed.data;
    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });
    
    return NextResponse.json({
      message: 'Akun berhasil dibuat!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }, { status: 201 });
  } catch (error) {
    console.error("REGISTER_ERROR", error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat mendaftar' }, { status: 500 });
  }
}

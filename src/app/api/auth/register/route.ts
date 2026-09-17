export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  workspaceId: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: ((parsed.error as any).errors)[0].message }, { status: 400 });
    }
    
    const { name, email, password, workspaceId } = parsed.data;
    
    let user = await prisma.user.findUnique({
      where: { email }
    });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    if (user) {
      // If user exists but doesn't have a password (e.g. placeholder from invite)
      if (!user.password) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name, password: hashedPassword }
        });
      } else {
        return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
      }
    } else {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword
        }
      });
    }

    if (workspaceId) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId }
      });

      if (workspace) {
        const existingMember = await prisma.workspaceMember.findFirst({
          where: { workspaceId: workspace.id, userId: user.id }
        });

        if (existingMember) {
          await prisma.workspaceMember.update({
            where: { id: existingMember.id },
            data: { joinedAt: new Date(), role: existingMember.role || 'CREATIVE_DIRECTOR' }
          });
        } else {
          await prisma.workspaceMember.create({
            data: {
              workspaceId: workspace.id,
              userId: user.id,
              role: 'CREATIVE_DIRECTOR',
              joinedAt: new Date()
            }
          });
        }
      }
    }
    
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

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { clientNoteSchema } from '@/lib/validations';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notes = await prisma.clientNote.findMany({
      where: { clientId: params.id },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = clientNoteSchema.parse(body);

    const note = await prisma.clientNote.create({
      data: {
        ...validated,
        clientId: params.id,
        authorId: session.user.id
      }
    });
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

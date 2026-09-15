export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import React from 'react';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getOrCreateDefaultWorkspace } from '@/lib/workspace';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/finance/invoice-pdf';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workspace } = await getOrCreateDefaultWorkspace(session.user.id);
    
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, workspaceId: workspace.id },
      include: {
        items: true,
        client: true,
        project: true
      }
    });

    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const buffer = await renderToBuffer(React.createElement(InvoicePDF, { invoice }) as any);

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNo}.pdf"`
      }
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

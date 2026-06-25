import { NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse');
import { analyzeMedicalReport } from '@/lib/qwen';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let reportText = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const text = formData.get('text') as string | null;

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());

        if (file.name.endsWith('.pdf')) {
          const pdfData = await pdf(buffer);
          reportText = pdfData.text;
        } else {
          reportText = buffer.toString('utf-8');
        }
      } else if (text) {
        reportText = text;
      }
    } else {
      const body = await request.json();
      reportText = body.text || '';
    }

    if (!reportText || reportText.trim().length < 20) {
      return NextResponse.json(
        { error: 'Please provide a medical report with sufficient content to analyze.' },
        { status: 400 }
      );
    }

    if (reportText.length > 15000) {
      return NextResponse.json(
        { error: 'Report text is too long. Please upload a report under 15,000 characters.' },
        { status: 400 }
      );
    }

    const analysis = await analyzeMedicalReport(reportText);

    return NextResponse.json({ success: true, analysis });
  } catch (error: unknown) {
    console.error('[API /analyze] Error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

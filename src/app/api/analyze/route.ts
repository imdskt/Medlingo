import { NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse');
import { analyzeMedicalReport } from '@/lib/qwen';

export const maxDuration = 60;

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

export async function POST(request: Request) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    let reportText = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const text = formData.get('text') as string | null;

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());

        if (file.name.endsWith('.pdf')) {
          try {
            const pdfData = await pdf(buffer);
            reportText = pdfData.text;
            
            // Check if PDF parsing produced meaningful text
            if (!reportText || reportText.trim().length < 20) {
              return NextResponse.json(
                { error: 'Could not extract text from this PDF. It may be encrypted, image-only, or corrupted. Please try a different format or upload the text directly.' },
                { status: 400 }
              );
            }
          } catch (pdfError) {
            console.error('[PDF Parse Error]:', pdfError);
            return NextResponse.json(
              { error: 'Failed to parse PDF. The file may be encrypted, password-protected, or corrupted. Please try converting to text first.' },
              { status: 400 }
            );
          }
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

import { NextResponse } from 'next/server';

export async function GET() {
  // Check environment variables
  const missingEnvVars: string[] = [];
  
  if (!process.env.QWEN_API_KEY) {
    missingEnvVars.push('QWEN_API_KEY');
  }
  
  // Check Alibaba Cloud credentials (if applicable)
  const hasAlibabaCreds = !!(process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET);
  
  return NextResponse.json({
    status: 'healthy',
    app: 'Medlingo',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    dependencies: {
      qwenApi: process.env.QWEN_API_KEY ? 'configured' : 'missing',
      alibabaCloud: hasAlibabaCreds ? 'configured' : 'not_configured',
    },
    warnings: missingEnvVars.length > 0 
      ? [`Missing environment variables: ${missingEnvVars.join(', ')}`]
      : [],
  });
}

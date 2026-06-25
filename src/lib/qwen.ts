import OpenAI from 'openai';
import { z } from 'zod';

const qwen = new OpenAI({
  apiKey: process.env.QWEN_API_KEY || '',
  baseURL: process.env.QWEN_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
});

// Zod schemas for validation
const MedicalFindingSchema = z.object({
  testName: z.string(),
  value: z.string(),
  normalRange: z.string().nullable(),
  status: z.enum(['normal', 'abnormal', 'critical']),
  explanation: z.string(),
});

const HindiTranslationSchema = z.object({
  summary: z.string(),
  criticalAlerts: z.array(z.string()),
  recommendations: z.array(z.string()),
});

const AnalysisResultSchema = z.object({
  summary: z.string(),
  findings: z.array(MedicalFindingSchema),
  criticalAlerts: z.array(z.string()),
  recommendations: z.array(z.string()),
  hindiTranslation: HindiTranslationSchema,
});

export interface MedicalFinding {
  testName: string;
  value: string;
  normalRange: string | null;
  status: 'normal' | 'abnormal' | 'critical';
  explanation: string;
}

export interface AnalysisResult {
  summary: string;
  findings: MedicalFinding[];
  criticalAlerts: string[];
  recommendations: string[];
  hindiTranslation: {
    summary: string;
    criticalAlerts: string[];
    recommendations: string[];
  };
  tokenUsage: number;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (error instanceof OpenAI.APIError && error.status && error.status < 500 && error.status !== 429) {
        throw error;
      }
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`[Qwen] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

export async function analyzeMedicalReport(reportText: string): Promise<AnalysisResult> {
  const systemPrompt = `You are a medical report analysis engine. Your job is to read a medical lab report or diagnostic report and translate it into simple, plain language that a non-medical person can easily understand.

RULES:
- Return ONLY valid JSON matching the schema below. No markdown, no explanation outside JSON.
- For each finding, clearly state whether it is "normal", "abnormal", or "critical".
- Mark a finding as "critical" ONLY if the value is dangerously outside normal range and requires immediate medical attention.
- Write explanations in extremely simple language. Imagine you are explaining to a person who has never studied biology.
- Include a Hindi translation of the summary, critical alerts, and recommendations.
- The Hindi should be simple, conversational Hindi (Hinglish is acceptable for medical terms that don't have common Hindi equivalents).
- If you cannot determine the normal range for a test, set normalRange to null.
- Do NOT provide medical diagnoses. Only explain what the numbers mean.

JSON Schema:
{
  "summary": "A 3-4 sentence plain-language overview of the entire report in English",
  "findings": [
    {
      "testName": "Name of the test",
      "value": "The reported value with units",
      "normalRange": "Normal reference range or null",
      "status": "normal" | "abnormal" | "critical",
      "explanation": "Simple explanation of what this test measures and what the result means"
    }
  ],
  "criticalAlerts": ["Array of plain-language warnings for any critical findings. Empty array if none."],
  "recommendations": ["Array of suggested next steps like 'Consult your doctor about X'"],
  "hindiTranslation": {
    "summary": "Hindi translation of the summary",
    "criticalAlerts": ["Hindi translations of critical alerts"],
    "recommendations": ["Hindi translations of recommendations"]
  }
}`;

  const result = await withRetry(async () => {
    return await qwen.chat.completions.create({
      model: process.env.QWEN_MODEL || 'qwen-plus',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this medical report and translate it into simple language:\n\n${reportText}` },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });
  });

  const content = result.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Qwen returned an empty response');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Failed to parse Qwen response as JSON: ${content.substring(0, 200)}`);
  }

  // Validate response against Zod schema
  const validation = AnalysisResultSchema.safeParse(parsed);
  if (!validation.success) {
    console.error('[Qwen] Validation error:', validation.error);
    throw new Error('AI response failed validation. The response format was incorrect.');
  }

  const tokenUsage = result.usage?.total_tokens ?? 0;
  console.log(`[Qwen] Medical analysis complete. Tokens used: ${tokenUsage}`);

  return { ...validation.data, tokenUsage };
}

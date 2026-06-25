# Medlingo

**AI Medical Report Translator — Understand your lab reports in plain English and Hindi**

Built for **Track 3: Social Impact** at the [Global AI Hackathon Series with Qwen Cloud](https://qwencloud-hackathon.devpost.com/).

## The Problem

Millions of patients — especially in rural India — receive medical lab reports written in complex English medical jargon they cannot understand. They have no idea whether their results are normal, abnormal, or dangerously critical until their next doctor visit, which may be days or weeks away.

## The Solution

Medlingo lets patients upload their medical reports (PDF or text) and instantly receive:

- **Plain-Language Summary** — What your report means in simple English
- **Detailed Findings** — Each test explained with normal/abnormal/critical status
- **Critical Alerts** — Prominent red warnings for dangerous values requiring immediate attention
- **Hindi Translation** — Full summary and alerts translated to conversational Hindi
- **Print Summary** — Take a printed copy to your doctor

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend & API | Next.js 15 (App Router) |
| AI Engine | Qwen Cloud (`qwen-plus`) via OpenAI SDK |
| PDF Parsing | `pdf-parse` |
| Styling | Tailwind CSS |
| Infrastructure | Docker + Alibaba Cloud SDK |
| Language | TypeScript |

## Getting Started

```bash
# Clone the repo
git clone https://github.com/sudhanshukrthakur/medlingo.git
cd medlingo

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Qwen Cloud API key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

```
User uploads PDF/Text
  → pdf-parse extracts text
  → Qwen Cloud (qwen-plus) analyzes medical data
  → Generates plain-language explanation (EN + HI)
  → Flags critical/abnormal values
  → Beautiful, accessible results UI
```

## Disclaimer

**Medlingo is for informational purposes only.** It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional.

## License

MIT License © 2026 Medlingo Contributors

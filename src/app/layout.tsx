import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medlingo — Understand Your Medical Reports",
  description: "Upload your medical report and get a simple, plain-language explanation in English and Hindi. Powered by Qwen Cloud AI.",
  keywords: ["medical report", "translator", "Hindi", "health", "AI", "Qwen Cloud"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Header */}
        <header className="border-b border-[var(--border-light)] bg-white/80 backdrop-blur-sm sticky top-0 z-50 no-print">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
                Medlingo
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
              <span>Social Impact • Track 3</span>
              <a 
                href="https://github.com/sudhanshukrthakur/medlingo"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--text-secondary)] transition-colors"
              >
                GitHub ↗
              </a>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-4xl mx-auto px-6 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--border-light)] mt-16 no-print">
          <div className="max-w-4xl mx-auto px-6 py-6 text-center text-sm text-[var(--text-muted)]">
            <p>Medlingo — Built with Qwen Cloud for the Global AI Hackathon Series</p>
            <p className="mt-1">This tool is for informational purposes only. Always consult a qualified healthcare professional.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

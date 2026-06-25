'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface MedicalFinding {
  testName: string;
  value: string;
  normalRange: string | null;
  status: 'normal' | 'abnormal' | 'critical';
  explanation: string;
}

interface AnalysisResult {
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

interface HistoryItem {
  id: string;
  date: string;
  title: string;
  data: AnalysisResult;
}

export default function HomePage() {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('medlingo_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history');
      }
    }
  }, []);

  const saveToHistory = (data: AnalysisResult, title: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      title,
      data
    };
    const updated = [newItem, ...history].slice(0, 5); // Keep last 5
    setHistory(updated);
    localStorage.setItem('medlingo_history', JSON.stringify(updated));
  };

  const handleFile = (f: File) => {
    // Robust validation checking extension and mime type
    const isPDF = f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf';
    const isTXT = f.name.toLowerCase().endsWith('.txt') || f.type === 'text/plain';
    
    if (!isPDF && !isTXT) {
      setError('Invalid file type. Please upload a strictly PDF or TXT file.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum allowed size is 10 MB.');
      return;
    }
    setFile(f);
    setFileName(f.name);
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      if (mode === 'upload' && file) {
        formData.append('file', file);
      } else if (mode === 'paste' && pasteText.trim()) {
        formData.append('text', pasteText.trim());
      } else {
        setError('Please upload a file or paste your report text.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      setResult(data.analysis);
      saveToHistory(data.analysis, mode === 'upload' ? (fileName || 'Uploaded File') : 'Pasted Text');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setResult(item.data);
    setError(null);
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setFileName(null);
    setPasteText('');
    setError(null);
  };

  return (
    <div>
      {/* Medical Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-8 text-sm flex items-start gap-3 shadow-sm">
        <span className="text-amber-600 text-lg leading-none mt-0.5">⚠️</span>
        <div>
          <strong className="block mb-1">MEDICAL DISCLAIMER</strong>
          This tool is powered by artificial intelligence and is strictly for educational and informational purposes. It is <strong>NOT</strong> a substitute for professional medical advice, diagnosis, or treatment. Always consult with your physician or a qualified healthcare provider regarding any medical condition or before making healthcare decisions.
        </div>
      </div>

      {/* Hero Section */}
      {!result && (
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
            Understand Your Medical Reports
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Upload your lab report or medical document. Medlingo uses AI to translate 
            complex medical jargon into <strong>simple language</strong> you can understand — 
            in <strong>English</strong> and <strong>हिन्दी</strong>.
          </p>
        </div>
      )}

      {/* Input Section */}
      {!result && (
        <div className="animate-slide-down">
          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-1 mb-6 bg-[var(--bg-accent)] rounded-xl p-1 max-w-xs mx-auto">
            <button
              onClick={() => setMode('upload')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'upload'
                  ? 'bg-white text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setMode('paste')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'paste'
                  ? 'bg-white text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Paste Text
            </button>
          </div>

          {/* Upload Zone */}
          {mode === 'upload' && (
            <div
              className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,text/plain,.pdf,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {fileName ? (
                <div>
                  <p className="text-lg font-medium text-[var(--text-primary)]">{fileName}</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Click to change file</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-[var(--text-secondary)]">
                    Drop your medical report here
                  </p>
                  <p className="text-sm text-[var(--text-muted)] mt-2">
                    Supports PDF and TXT files (max 10 MB)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Paste Zone */}
          {mode === 'paste' && (
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your medical report text here...

Example:
Hemoglobin: 10.2 g/dL (Normal: 12.0 - 15.5)
WBC Count: 15,000 /µL (Normal: 4,000 - 11,000)
Blood Sugar (Fasting): 250 mg/dL (Normal: 70 - 100)
Cholesterol: 280 mg/dL (Normal: < 200)"
              className="w-full h-64 p-4 rounded-2xl border-2 border-[var(--border)] bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--green-500)] transition-colors resize-none text-sm leading-relaxed"
            />
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-[var(--red-50)] border border-[var(--red-100)] text-[var(--red-600)] text-sm">
              {error}
            </div>
          )}

          {/* Analyze Button */}
          <div className="mt-6 text-center">
            <button
              onClick={handleAnalyze}
              disabled={loading || (mode === 'upload' ? !file : !pasteText.trim())}
              className="btn-primary inline-flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing with Qwen AI...
                </>
              ) : (
                <>Analyze Report</>
              )}
            </button>
          </div>

          {/* Recent History */}
          {history.length > 0 && !loading && (
            <div className="mt-12 max-w-lg mx-auto">
              <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                Recent Translations
              </h3>
              <div className="space-y-2">
                {history.map(item => (
                  <button
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className="w-full text-left p-4 rounded-xl border border-[var(--border-light)] bg-white hover:border-[var(--green-500)] hover:shadow-sm transition-all flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--green-600)] transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{item.date}</p>
                    </div>
                    <span className="text-[var(--text-muted)] group-hover:text-[var(--green-600)] transition-colors">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="animate-fade-in">
          {/* Back button */}
          <button
            onClick={handleReset}
            className="mb-6 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors no-print"
          >
            ← Analyze another report
          </button>

          {/* Critical Alerts */}
          {result.criticalAlerts.length > 0 && (
            <div className="mb-6 space-y-3">
              {result.criticalAlerts.map((alert, i) => (
                <div key={i} className="critical-banner flex items-start gap-3">
                  <div>
                    <p className="font-semibold text-[var(--red-600)] text-sm">Critical Alert</p>
                    <p className="text-[var(--text-primary)] text-sm mt-1">{alert}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="bg-white border border-[var(--border-light)] rounded-2xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[var(--green-50)] text-[var(--green-600)] text-xs font-bold px-3 py-1 rounded-bl-xl border-l border-b border-[var(--green-100)]">
              HIGH CONFIDENCE
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              Report Summary
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">{result.summary}</p>
          </div>

          {/* Findings */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              Detailed Findings
              <span className="text-sm font-normal text-[var(--text-muted)]">
                ({result.findings.length} tests)
              </span>
            </h2>
            <div className="space-y-3">
              {result.findings.map((finding, i) => (
                <div key={i} className="finding-card">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)]">{finding.testName}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-mono font-semibold text-[var(--text-primary)]">
                          {finding.value}
                        </span>
                        {finding.normalRange && (
                          <span className="text-xs text-[var(--text-muted)]">
                            Normal: {finding.normalRange}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 badge-${finding.status}`}>
                      {finding.status === 'normal' && 'Normal'}
                      {finding.status === 'abnormal' && 'Abnormal'}
                      {finding.status === 'critical' && 'Critical'}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {finding.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="bg-[var(--blue-50)] border border-blue-100 rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                Recommendations
              </h2>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="text-[var(--blue-500)] mt-0.5">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hindi Translation */}
          <div className="hindi-section mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              हिन्दी में सारांश
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              {result.hindiTranslation.summary}
            </p>
            
            {result.hindiTranslation.criticalAlerts.length > 0 && (
              <div className="mb-3">
                <p className="font-medium text-[var(--red-600)] text-sm mb-1">गंभीर चेतावनी:</p>
                <ul className="space-y-1">
                  {result.hindiTranslation.criticalAlerts.map((alert, i) => (
                    <li key={i} className="text-sm text-[var(--red-600)]">• {alert}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.hindiTranslation.recommendations.length > 0 && (
              <div>
                <p className="font-medium text-[var(--text-primary)] text-sm mb-1">सलाह:</p>
                <ul className="space-y-1">
                  {result.hindiTranslation.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-[var(--text-secondary)]">→ {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Print / Token Info */}
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mt-8 pt-4 border-t border-[var(--border-light)]">
            <span>Analyzed by Qwen Cloud (qwen-plus) • {result.tokenUsage} tokens used</span>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-[var(--bg-accent)] hover:bg-[var(--green-50)] transition-colors no-print"
            >
              Print Summary
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

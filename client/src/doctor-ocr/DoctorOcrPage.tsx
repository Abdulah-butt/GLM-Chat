import { useCallback, useEffect, useRef, useState } from 'react';
import { UploadZone } from './components/UploadZone';
import { ProcessingView } from './components/ProcessingView';
import { ResultsDashboard } from './components/ResultsDashboard';
import { AnalyzeError, analyzeReport } from './api';
import type { AnalysisResult } from './types';
import './doctor-ocr.css';

type PageState =
  | { phase: 'idle' }
  | { phase: 'processing'; fileName: string }
  | { phase: 'done'; result: AnalysisResult }
  | { phase: 'error'; message: string; file: File };

const DoctorOcrPage = (): JSX.Element => {
  const [state, setState] = useState<PageState>({ phase: 'idle' });
  const pendingRef = useRef(false);

  useEffect(() => {
    document.title = 'Doctor OCR | Medical Report Analyzer';
  }, []);

  const runAnalysis = useCallback(async (file: File) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setState({ phase: 'processing', fileName: file.name });
    try {
      const result = await analyzeReport(file);
      setState({ phase: 'done', result });
    } catch (err) {
      setState({
        phase: 'error',
        message:
          err instanceof AnalyzeError ? err.message : 'Something went wrong. Please try again.',
        file,
      });
    } finally {
      pendingRef.current = false;
    }
  }, []);

  return (
    <div className="docr-root">
      <header className="docr-header">
        <div className="docr-header-inner">
          <div className="docr-brand">
            <span className="docr-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6" />
                <path d="M9 14h6" />
                <path d="M12 11v6" />
              </svg>
            </span>
            <span className="docr-brand-name">Doctor OCR</span>
          </div>
          <span className="docr-header-tag">Medical report analyzer</span>
        </div>
      </header>

      <main className="docr-main">
        {state.phase === 'idle' && (
          <>
            <section className="docr-hero">
              <h1>Understand your lab report in plain language</h1>
              <p>
                Upload a laboratory report (CBC, vitamin D, thyroid, liver, kidney, lipids, glucose,
                hormones, urine and more). We read it, extract every test marker, and explain the
                results in words you can actually understand.
              </p>
            </section>

            <div className="docr-alert docr-alert-info docr-disclaimer" role="note">
              <strong>Medical disclaimer:</strong> This tool is educational and informational only.
              It does not provide a diagnosis and does not replace professional medical advice.
              Always discuss your results with a qualified healthcare professional.
            </div>

            <UploadZone onAnalyze={(file) => void runAnalysis(file)} disabled={false} />
          </>
        )}

        {state.phase === 'processing' && <ProcessingView fileName={state.fileName} />}

        {state.phase === 'done' && (
          <ResultsDashboard result={state.result} onReset={() => setState({ phase: 'idle' })} />
        )}

        {state.phase === 'error' && (
          <div className="docr-error-view">
            <div className="docr-error-icon" aria-hidden="true">⚠</div>
            <h2>We couldn’t analyze this report</h2>
            <p>{state.message}</p>
            <div className="docr-error-actions">
              <button
                type="button"
                className="docr-button-primary"
                onClick={() => void runAnalysis(state.file)}
              >
                Try again
              </button>
              <button
                type="button"
                className="docr-button-secondary"
                onClick={() => setState({ phase: 'idle' })}
              >
                Choose another file
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="docr-footer">
        Educational use only — not medical advice. Reports are processed in memory and not stored.
      </footer>
    </div>
  );
};

export default DoctorOcrPage;

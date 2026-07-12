import { useEffect, useState } from 'react';

export const PROCESSING_STAGES = [
  'Uploading report',
  'Reading the pages',
  'Extracting test markers',
  'Reviewing reference ranges',
  'Preparing your summary',
] as const;

// Rough pacing tuned to a typical ~30s single-call analysis: move briskly through
// the early stages and hold on the last one until the server responds.
const STAGE_DELAYS_MS = [1000, 3000, 7000, 8000];

interface ProcessingViewProps {
  fileName: string;
}

export const ProcessingView = ({ fileName }: ProcessingViewProps): JSX.Element => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= STAGE_DELAYS_MS.length) return;
    const timer = window.setTimeout(() => setStage((s) => s + 1), STAGE_DELAYS_MS[stage]);
    return () => window.clearTimeout(timer);
  }, [stage]);

  return (
    <div className="docr-processing" aria-live="polite">
      <div className="docr-scan-doc" aria-hidden="true">
        <div className="docr-scan-page">
          <span className="docr-skel docr-skel-w60" />
          <span className="docr-skel docr-skel-w80" />
          <span className="docr-skel docr-skel-w70" />
          <span className="docr-skel docr-skel-w80" />
          <span className="docr-skel docr-skel-w50" />
          <span className="docr-skel docr-skel-w75" />
          <div className="docr-scan-line" />
        </div>
      </div>

      <h2 className="docr-processing-title">Analyzing {fileName}</h2>

      <ol className="docr-stages">
        {PROCESSING_STAGES.map((label, index) => {
          const state = index < stage ? 'done' : index === stage ? 'active' : 'pending';
          return (
            <li key={label} className={`docr-stage docr-stage-${state}`}>
              <span className="docr-stage-dot" aria-hidden="true">
                {state === 'done' ? '✓' : ''}
              </span>
              {label}
              {state === 'active' && <span className="docr-stage-pulse" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      <p className="docr-processing-hint">This usually takes under a minute for typical reports.</p>
    </div>
  );
};

import { MarkerList, STATUS_PRESENTATION } from './MarkerList';
import type { AnalysisResult } from '../types';

interface ResultsDashboardProps {
  result: AnalysisResult;
  onReset: () => void;
}

const InfoRow = ({ label, value }: { label: string; value: string | null }): JSX.Element | null => {
  if (value === null || value === '') return null;
  return (
    <div className="docr-info-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
};

const URGENCY_COPY: Record<AnalysisResult['summary']['urgency'], { label: string; note: string }> = {
  routine: { label: 'Routine', note: 'Discuss at your next regular appointment.' },
  soon: { label: 'Worth a timely visit', note: 'Consider booking an appointment soon.' },
  prompt: {
    label: 'Contact a professional promptly',
    note: 'Some values may need timely attention. AI reading of documents can be imperfect, so please verify with a healthcare professional promptly.',
  },
};

export const ResultsDashboard = ({ result, onReset }: ResultsDashboardProps): JSX.Element => {
  const abnormal = result.markers.filter((m) => m.status !== 'normal' && m.status !== 'unknown');
  const urgency = URGENCY_COPY[result.summary.urgency];

  return (
    <div className="docr-results">
      <div className="docr-results-topbar">
        <div>
          <h2>Report analysis</h2>
          <p className="docr-results-file">
            {result.source.fileName} · {result.source.pageCount}{' '}
            {result.source.pageCount === 1 ? 'page' : 'pages'} ·{' '}
            {new Date(result.source.analyzedAt).toLocaleString()}
          </p>
        </div>
        <button type="button" className="docr-button-secondary" onClick={onReset}>
          Upload another report
        </button>
      </div>

      {result.status === 'partial' && (
        <div className="docr-alert docr-alert-warn" role="alert">
          <span aria-hidden="true">⚠</span> We could only partially analyze this report. The
          information below may be incomplete — missing items are listed at the bottom.
        </div>
      )}

      {result.summary.urgency !== 'routine' && (
        <div
          className={`docr-alert ${result.summary.urgency === 'prompt' ? 'docr-alert-error' : 'docr-alert-warn'}`}
          role="alert"
        >
          <span aria-hidden="true">⚠</span> <strong>{urgency.label}.</strong> {urgency.note}
        </div>
      )}

      <div className="docr-info-grid">
        <section className="docr-card">
          <h3>Report</h3>
          <dl>
            <InfoRow label="Type" value={result.report.reportType} />
            <InfoRow label="Specialty" value={result.report.medicalSpecialty} />
            <InfoRow label="Laboratory" value={result.report.laboratoryName} />
            <InfoRow label="Hospital" value={result.report.hospitalName} />
            <InfoRow label="Report no." value={result.report.reportNumber} />
            <InfoRow label="Collected" value={result.report.sampleCollectedAt} />
            <InfoRow label="Issued" value={result.report.reportIssuedAt} />
          </dl>
        </section>
        <section className="docr-card">
          <h3>Patient</h3>
          <dl>
            <InfoRow label="Name" value={result.patient.name} />
            <InfoRow label="Age" value={result.patient.age} />
            <InfoRow label="Date of birth" value={result.patient.dateOfBirth} />
            <InfoRow label="Gender" value={result.patient.gender} />
            <InfoRow label="Patient ID" value={result.patient.patientId} />
          </dl>
        </section>
        <section className="docr-card">
          <h3>Referring doctor</h3>
          <dl>
            <InfoRow label="Name" value={result.doctor.name} />
            <InfoRow label="Specialty" value={result.doctor.specialty} />
            <InfoRow label="Clinic / hospital" value={result.doctor.clinicOrHospital} />
          </dl>
          {result.doctor.name === null && result.doctor.clinicOrHospital === null && (
            <p className="docr-empty-note">Not mentioned in the report.</p>
          )}
        </section>
      </div>

      <section className="docr-card docr-summary">
        <h3>Summary</h3>
        <p className="docr-summary-overview">{result.summary.overview}</p>

        {result.summary.importantFindings.length > 0 && (
          <div className="docr-findings">
            <h4>
              <span className="docr-dot docr-dot-warn" aria-hidden="true" /> Important findings
            </h4>
            <ul>
              {result.summary.importantFindings.map((finding) => (
                <li key={finding}>{finding}</li>
              ))}
            </ul>
          </div>
        )}

        {result.summary.normalFindings.length > 0 && (
          <div className="docr-findings">
            <h4>
              <span className="docr-dot docr-dot-ok" aria-hidden="true" /> Reassuring findings
            </h4>
            <ul>
              {result.summary.normalFindings.map((finding) => (
                <li key={finding}>{finding}</li>
              ))}
            </ul>
          </div>
        )}

        {result.summary.pointsToDiscussWithDoctor.length > 0 && (
          <div className="docr-findings">
            <h4>
              <span className="docr-dot docr-dot-info" aria-hidden="true" /> To discuss with your doctor
            </h4>
            <ul>
              {result.summary.pointsToDiscussWithDoctor.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {abnormal.length > 0 && (
        <section className="docr-card" aria-labelledby="docr-abnormal-heading">
          <h3 id="docr-abnormal-heading">Out-of-range markers ({abnormal.length})</h3>
          <div className="docr-abnormal-grid">
            {abnormal.map((marker) => {
              const p = STATUS_PRESENTATION[marker.status];
              return (
                <div key={marker.id} className={`docr-abnormal-chip docr-abnormal-${p.tone}`}>
                  <span className="docr-abnormal-name">{marker.label}</span>
                  <span className="docr-abnormal-value">
                    {marker.rawValue}
                    {marker.unit !== null ? ` ${marker.unit}` : ''}
                  </span>
                  <span className="docr-abnormal-status">
                    <span aria-hidden="true">{p.icon}</span> {p.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <MarkerList markers={result.markers} />

      {result.suggestedDoctorQuestions.length > 0 && (
        <section className="docr-card" aria-labelledby="docr-questions-heading">
          <h3 id="docr-questions-heading">Questions to ask your doctor</h3>
          <ol className="docr-questions">
            {result.suggestedDoctorQuestions.map((question) => (
              <li key={question.id}>
                <p className="docr-question">{question.question}</p>
                {question.reason !== '' && <p className="docr-question-reason">{question.reason}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {(result.quality.missingInformation.length > 0 || result.quality.warnings.length > 0) && (
        <section className="docr-card docr-quality">
          <h3>Extraction notes</h3>
          {result.quality.missingInformation.length > 0 && (
            <p>
              <strong>Not found in the report:</strong>{' '}
              {result.quality.missingInformation.join(', ')}
            </p>
          )}
          {result.quality.warnings.length > 0 && (
            <p>
              <strong>Warnings:</strong> {result.quality.warnings.join(' · ')}
            </p>
          )}
          <p>
            Overall extraction confidence: {Math.round(result.quality.overallConfidence * 100)}%
            {result.quality.requiresManualReview ? ' · please double-check against the original report' : ''}
          </p>
        </section>
      )}

      <p className="docr-disclaimer-footer">{result.summary.disclaimer}</p>
    </div>
  );
};

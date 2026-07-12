import { useMemo, useState } from 'react';
import type { AnalyzedMarker, MarkerStatus } from '../types';

const PAGE_SIZE = 10;

type FilterKey = 'all' | 'high' | 'low' | 'normal' | 'abnormal' | 'critical';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'high', label: 'High' },
  { key: 'low', label: 'Low' },
  { key: 'normal', label: 'Normal' },
  { key: 'abnormal', label: 'Abnormal' },
  { key: 'critical', label: 'Critical' },
];

const matchesFilter = (status: MarkerStatus, filter: FilterKey): boolean => {
  switch (filter) {
    case 'all':
      return true;
    case 'critical':
      return status === 'critical-low' || status === 'critical-high';
    case 'abnormal':
      return status === 'abnormal';
    default:
      return status === filter;
  }
};

export const STATUS_PRESENTATION: Record<MarkerStatus, { label: string; icon: string; tone: string }> = {
  normal: { label: 'Normal', icon: '✓', tone: 'ok' },
  low: { label: 'Low', icon: '↓', tone: 'warn' },
  high: { label: 'High', icon: '↑', tone: 'warn' },
  'critical-low': { label: 'Critical low', icon: '⚠', tone: 'crit' },
  'critical-high': { label: 'Critical high', icon: '⚠', tone: 'crit' },
  abnormal: { label: 'Abnormal', icon: '!', tone: 'warn' },
  unknown: { label: 'No range', icon: '?', tone: 'muted' },
};

const StatusBadge = ({ status }: { status: MarkerStatus }): JSX.Element => {
  const p = STATUS_PRESENTATION[status];
  return (
    <span className={`docr-status docr-status-${p.tone}`}>
      <span aria-hidden="true">{p.icon}</span> {p.label}
    </span>
  );
};

const MarkerCard = ({ marker }: { marker: AnalyzedMarker }): JSX.Element => {
  const [expanded, setExpanded] = useState(false);
  const range = marker.referenceRange;

  return (
    <div className={`docr-marker ${expanded ? 'expanded' : ''}`}>
      <button
        type="button"
        className="docr-marker-head"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="docr-marker-title">
          <span className="docr-marker-name">{marker.label}</span>
          {marker.testCode !== null && <span className="docr-marker-code">{marker.testCode}</span>}
        </div>
        <div className="docr-marker-value">
          <strong>{marker.rawValue}</strong>
          {marker.unit !== null && <span className="docr-marker-unit"> {marker.unit}</span>}
        </div>
        <StatusBadge status={marker.status} />
        <span className="docr-marker-chevron" aria-hidden="true">{expanded ? '▴' : '▾'}</span>
      </button>

      {expanded && (
        <div className="docr-marker-body">
          <dl className="docr-marker-facts">
            <div>
              <dt>Reference range</dt>
              <dd>{range.raw ?? (range.minimum !== null || range.maximum !== null ? `${range.minimum ?? '—'} – ${range.maximum ?? '—'}` : 'Not printed in report')}</dd>
            </div>
            {marker.reportFlag !== null && (
              <div>
                <dt>Report flag</dt>
                <dd>{marker.reportFlag}</dd>
              </div>
            )}
            <div>
              <dt>Extraction confidence</dt>
              <dd>{Math.round(marker.confidence * 100)}%</dd>
            </div>
            {marker.sourcePage !== null && (
              <div>
                <dt>Source page</dt>
                <dd>{marker.sourcePage}</dd>
              </div>
            )}
          </dl>
          {marker.explanation !== '' && (
            <p className="docr-marker-text"><strong>About this test:</strong> {marker.explanation}</p>
          )}
          {marker.resultInterpretation !== '' && (
            <p className="docr-marker-text"><strong>Your result:</strong> {marker.resultInterpretation}</p>
          )}
          {marker.warnings.length > 0 && (
            <p className="docr-marker-warning" role="note">
              <span aria-hidden="true">⚠</span> {marker.warnings.join(' · ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const MarkerList = ({ markers }: { markers: AnalyzedMarker[] }): JSX.Element => {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const counts = useMemo(() => {
    const map = new Map<FilterKey, number>();
    for (const f of FILTERS) {
      map.set(f.key, markers.filter((m) => matchesFilter(m.status, f.key)).length);
    }
    return map;
  }, [markers]);

  const filtered = useMemo(
    () => markers.filter((m) => matchesFilter(m.status, filter)),
    [markers, filter],
  );
  const visible = filtered.slice(0, visibleCount);

  return (
    <section className="docr-card" aria-labelledby="docr-markers-heading">
      <h3 id="docr-markers-heading">Test markers ({markers.length})</h3>

      <div className="docr-filters" role="group" aria-label="Filter markers by status">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`docr-filter ${filter === key ? 'active' : ''}`}
            onClick={() => {
              setFilter(key);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            {label} <span className="docr-filter-count">{counts.get(key)}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="docr-empty-note">No markers match this filter.</p>
      ) : (
        <div className="docr-marker-list">
          {visible.map((marker) => (
            <MarkerCard key={marker.id} marker={marker} />
          ))}
        </div>
      )}

      {filtered.length > visibleCount && (
        <button
          type="button"
          className="docr-button-secondary docr-show-more"
          onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
        >
          Show {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more of{' '}
          {filtered.length - visibleCount} remaining
        </button>
      )}
    </section>
  );
};

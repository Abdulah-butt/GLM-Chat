import { useRef, useState, type DragEvent } from 'react';

const MAX_FILE_MB = 10;

interface UploadZoneProps {
  onAnalyze: (file: File) => void;
  disabled: boolean;
}

const formatSize = (bytes: number): string =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

export const UploadZone = ({ onAnalyze, disabled }: UploadZoneProps): JSX.Element => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const selectFile = (candidate: File | undefined): void => {
    setFileError(null);
    if (candidate === undefined) return;
    const isPdf =
      candidate.type === 'application/pdf' || candidate.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFile(null);
      setFileError('Only PDF files are supported. Please upload your report as a PDF.');
      return;
    }
    if (candidate.size > MAX_FILE_MB * 1024 * 1024) {
      setFile(null);
      setFileError(`This file is too large. The maximum size is ${MAX_FILE_MB} MB.`);
      return;
    }
    if (candidate.size === 0) {
      setFile(null);
      setFileError('This file is empty. Please choose a valid PDF report.');
      return;
    }
    setFile(candidate);
  };

  const handleDrop = (event: DragEvent): void => {
    event.preventDefault();
    setIsDragOver(false);
    selectFile(event.dataTransfer.files[0]);
  };

  return (
    <div className="docr-upload-section">
      <div
        className={`docr-dropzone ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        aria-label="Upload a PDF medical report"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          onChange={(event) => {
            selectFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <div className="docr-dropzone-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6" />
            <path d="M12 18v-6" />
            <path d="m9 15 3 3 3-3" transform="rotate(180 12 15.5)" />
          </svg>
        </div>
        <p className="docr-dropzone-title">Drag &amp; drop your report here</p>
        <p className="docr-dropzone-hint">or click to browse · PDF only · up to {MAX_FILE_MB} MB</p>
      </div>

      {fileError !== null && (
        <div className="docr-alert docr-alert-error" role="alert">
          <span aria-hidden="true">⚠</span> {fileError}
        </div>
      )}

      {file !== null && (
        <div className="docr-file-card">
          <div className="docr-file-meta">
            <span className="docr-file-badge" aria-hidden="true">PDF</span>
            <div>
              <p className="docr-file-name">{file.name}</p>
              <p className="docr-file-size">{formatSize(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            className="docr-button-primary"
            onClick={() => onAnalyze(file)}
            disabled={disabled}
          >
            Analyze report
          </button>
        </div>
      )}

      <p className="docr-privacy-note">
        Your report is processed in memory to generate this analysis and is not stored on our
        servers. Processing uses a secure AI service; no data is used for advertising.
      </p>
    </div>
  );
};

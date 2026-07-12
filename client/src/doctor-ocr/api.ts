import type { AnalysisResult } from './types';

export class AnalyzeError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'AnalyzeError';
    this.code = code;
  }
}

const CLIENT_TIMEOUT_MS = 120_000;

export const analyzeReport = async (file: File): Promise<AnalysisResult> => {
  const form = new FormData();
  form.append('report', file);

  let response: Response;
  try {
    response = await fetch('/api/v1/doctor-ocr/analyze', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      throw new AnalyzeError(
        'The analysis is taking longer than expected. Please try again.',
        'CLIENT_TIMEOUT',
      );
    }
    throw new AnalyzeError(
      'Unable to reach the server. Check your connection and try again.',
      'NETWORK_ERROR',
    );
  }

  const body = (await response.json().catch(() => null)) as
    | { success: true; data: AnalysisResult }
    | { success: false; error?: { code?: string; message?: string } }
    | null;

  if (body === null) {
    throw new AnalyzeError('The server returned an unexpected response. Please try again.', 'PARSE_ERROR');
  }

  if (!body.success) {
    throw new AnalyzeError(
      body.error?.message ?? 'Something went wrong. Please try again.',
      body.error?.code ?? 'UNKNOWN_ERROR',
    );
  }

  return body.data;
};

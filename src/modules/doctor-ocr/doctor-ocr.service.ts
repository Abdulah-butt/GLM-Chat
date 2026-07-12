import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { ERROR_CODES } from '../../config/constants.js';
import { AppError } from '../../core/errors/AppError.js';
import { HTTP_STATUS } from '../../core/http/statusCodes.js';
import { glmChatRequest } from '../../infra/glm/glmClient.js';
import { logger } from '../../infra/logger/logger.js';
import { validatePdf } from './doctor-ocr.pdf.js';
import { renderPdfToImages } from './doctor-ocr.render.js';
import { buildReportAnalysisPrompt } from './doctor-ocr.prompt.js';
import { aiAnalysisSchema, extractJsonObject, type AiAnalysis } from './doctor-ocr.validation.js';
import type { AnalysisResult, MarkerStatus, UrgencyLevel } from './doctor-ocr.types.js';

export interface AnalyzeReportInput {
  fileName: string;
  buffer: Buffer;
}

const DEFAULT_DISCLAIMER =
  'This analysis is educational and informational only. It is not a medical diagnosis and does not ' +
  'replace professional medical advice. Always discuss your results with a qualified healthcare professional.';

const extractContent = (payload: { choices?: { message?: { content?: string | null } }[] }): string => {
  const content = payload.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content.trim() : '';
};

// One vision call: read the page image(s) and return the structured JSON directly.
// Retries once on failure; timeouts are kept short so a slow free-tier response
// fails fast instead of hanging for minutes.
const runVisionAnalysis = async (
  pageImageUrls: string[],
  requestId: string,
): Promise<AiAnalysis> => {
  const body = {
    model: env.GLM_OCR_MODEL,
    stream: false,
    thinking: { type: 'disabled' },
    messages: [
      {
        role: 'user',
        content: [
          ...pageImageUrls.map((url) => ({ type: 'image_url' as const, image_url: { url } })),
          { type: 'text', text: buildReportAnalysisPrompt() },
        ],
      },
    ],
  };

  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = extractContent(await glmChatRequest(body, requestId, env.DOCTOR_OCR_TIMEOUT_MS));
      if (raw === '') throw new Error('empty model response');
      // Repair (fences, trailing content) then validate — unvalidated model
      // output is never returned to the client.
      return aiAnalysisSchema.parse(extractJsonObject(raw));
    } catch (err) {
      lastError = err;
      // A timeout on the first attempt won't get faster on retry — fail fast.
      if (err instanceof AppError && err.code === ERROR_CODES.GLM_TIMEOUT) throw err;
      logger.warn(
        { requestId, attempt, reason: err instanceof Error ? err.message.slice(0, 200) : 'unknown' },
        'Doctor OCR analysis attempt failed',
      );
    }
  }

  if (lastError instanceof AppError) throw lastError;
  throw new AppError(
    ERROR_CODES.ANALYSIS_FAILED,
    'We could not produce a structured analysis for this report. Please try again.',
    HTTP_STATUS.BAD_GATEWAY,
  );
};

export const analyzeReport = async (
  input: AnalyzeReportInput,
  requestId: string,
): Promise<AnalysisResult> => {
  if (env.GLM_API_KEY === '') {
    throw new AppError(
      ERROR_CODES.CHAT_NOT_CONFIGURED,
      'The analysis service is not configured yet. Please try again later.',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
  }

  const uploadedAt = new Date().toISOString();
  const { pageCount } = await validatePdf(input.buffer);

  // Privacy: only structural metadata is ever logged — never report contents
  // or patient-identifying information.
  logger.info({ requestId, pageCount, fileBytes: input.buffer.length }, 'Doctor OCR started');

  const pageImages = renderPdfToImages(input.buffer, env.DOCTOR_OCR_MAX_PAGES);
  if (pageImages.length === 0) {
    throw new AppError(
      ERROR_CODES.PDF_EMPTY,
      'This PDF has no renderable pages.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const analysis = await runVisionAnalysis(
    pageImages.map((image) => image.dataUrl),
    requestId,
  );

  const markerIdMap = new Map<string, string>();
  const markers = analysis.markers.map((marker, index) => {
    const id = `mk_${index + 1}`;
    if (marker.id !== null) markerIdMap.set(marker.id, id);
    return {
      ...marker,
      id,
      originalName: marker.originalName ?? 'Unknown test',
      label: marker.label ?? marker.originalName ?? 'Unknown test',
      rawValue: marker.rawValue ?? '',
      status: marker.status as MarkerStatus,
      explanation: marker.explanation ?? '',
      resultInterpretation: marker.resultInterpretation ?? '',
      sourcePage: marker.sourcePage === null ? null : Math.round(marker.sourcePage),
    };
  });

  const suggestedDoctorQuestions = analysis.suggestedDoctorQuestions
    .filter((question) => question.question !== null)
    .map((question, index) => ({
      id: `q_${index + 1}`,
      question: question.question ?? '',
      reason: question.reason ?? '',
      relatedMarkerIds: question.relatedMarkerIds
        .map((id) => markerIdMap.get(id))
        .filter((id): id is string => id !== undefined),
    }));

  const qualityWarnings = [...analysis.quality.warnings];
  if (markers.length === 0) {
    qualityWarnings.push('No medical markers were detected in this document.');
  }

  const result: AnalysisResult = {
    schemaVersion: '1.0',
    analysisId: randomUUID(),
    status: markers.length > 0 ? 'completed' : 'partial',
    source: {
      fileName: input.fileName,
      fileType: 'application/pdf',
      pageCount,
      uploadedAt,
      analyzedAt: new Date().toISOString(),
      ocrModel: env.GLM_OCR_MODEL,
      analysisModel: env.GLM_OCR_MODEL,
    },
    report: analysis.report,
    patient: analysis.patient,
    doctor: analysis.doctor,
    markers,
    summary: {
      overview: analysis.summary.overview ?? '',
      importantFindings: analysis.summary.importantFindings,
      normalFindings: analysis.summary.normalFindings,
      pointsToDiscussWithDoctor: analysis.summary.pointsToDiscussWithDoctor,
      urgency: analysis.summary.urgency as UrgencyLevel,
      disclaimer: analysis.summary.disclaimer ?? DEFAULT_DISCLAIMER,
    },
    suggestedDoctorQuestions,
    quality: {
      ...analysis.quality,
      warnings: qualityWarnings,
      requiresManualReview: analysis.quality.requiresManualReview || markers.length === 0,
    },
  };

  logger.info(
    { requestId, analysisId: result.analysisId, markerCount: markers.length, status: result.status },
    'Doctor OCR completed',
  );

  return result;
};

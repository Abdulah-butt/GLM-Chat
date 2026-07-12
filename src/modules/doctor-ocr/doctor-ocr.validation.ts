import { z } from 'zod';
import { MARKER_STATUSES, URGENCY_LEVELS } from './doctor-ocr.types.js';

// Lenient coercions: the model occasionally emits numbers as strings or omits
// optional fields entirely. Normalize instead of failing the whole analysis.
const nullableString = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text === '' ? null : text;
  });

const nullableNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) return null;
    const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  });

const confidenceSchema = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
    if (!Number.isFinite(parsed)) return 0;
    return Math.min(1, Math.max(0, parsed > 1 ? parsed / 100 : parsed));
  });

const stringArray = z
  .union([z.array(z.unknown()), z.null(), z.undefined()])
  .transform((value) =>
    (value ?? [])
      .map((item) => String(item ?? '').trim())
      .filter((item) => item !== ''),
  );

const markerSchema = z.object({
  id: nullableString,
  originalName: nullableString,
  label: nullableString,
  testCode: nullableString,
  rawValue: nullableString,
  numericValue: nullableNumber,
  unit: nullableString,
  referenceRange: z
    .object({
      raw: nullableString,
      minimum: nullableNumber,
      maximum: nullableNumber,
    })
    .nullish()
    .transform((value) => value ?? { raw: null, minimum: null, maximum: null }),
  status: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) =>
      (MARKER_STATUSES as readonly string[]).includes(String(value)) ? String(value) : 'unknown',
    ),
  reportFlag: nullableString,
  explanation: nullableString,
  resultInterpretation: nullableString,
  confidence: confidenceSchema,
  sourcePage: nullableNumber,
  warnings: stringArray,
});

const questionSchema = z.object({
  id: nullableString,
  question: nullableString,
  reason: nullableString,
  relatedMarkerIds: stringArray,
});

export const aiAnalysisSchema = z.object({
  report: z
    .object({
      reportType: nullableString,
      medicalSpecialty: nullableString,
      laboratoryName: nullableString,
      hospitalName: nullableString,
      reportNumber: nullableString,
      sampleCollectedAt: nullableString,
      reportIssuedAt: nullableString,
    })
    .nullish()
    .transform(
      (value) =>
        value ?? {
          reportType: null,
          medicalSpecialty: null,
          laboratoryName: null,
          hospitalName: null,
          reportNumber: null,
          sampleCollectedAt: null,
          reportIssuedAt: null,
        },
    ),
  patient: z
    .object({
      name: nullableString,
      age: nullableString,
      dateOfBirth: nullableString,
      gender: nullableString,
      patientId: nullableString,
    })
    .nullish()
    .transform(
      (value) =>
        value ?? { name: null, age: null, dateOfBirth: null, gender: null, patientId: null },
    ),
  doctor: z
    .object({
      name: nullableString,
      specialty: nullableString,
      clinicOrHospital: nullableString,
    })
    .nullish()
    .transform((value) => value ?? { name: null, specialty: null, clinicOrHospital: null }),
  markers: z.array(markerSchema).catch([]),
  summary: z.object({
    overview: nullableString,
    importantFindings: stringArray,
    normalFindings: stringArray,
    pointsToDiscussWithDoctor: stringArray,
    urgency: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((value) =>
        (URGENCY_LEVELS as readonly string[]).includes(String(value)) ? String(value) : 'routine',
      ),
    disclaimer: nullableString,
  }),
  suggestedDoctorQuestions: z.array(questionSchema).catch([]),
  quality: z
    .object({
      overallConfidence: confidenceSchema,
      missingInformation: stringArray,
      warnings: stringArray,
      requiresManualReview: z
        .union([z.boolean(), z.null(), z.undefined()])
        .transform((value) => value === true),
    })
    .nullish()
    .transform(
      (value) =>
        value ?? {
          overallConfidence: 0,
          missingInformation: [],
          warnings: [],
          requiresManualReview: true,
        },
    ),
});

export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;

// Extract the FIRST complete, balanced JSON object from a model response that
// may be wrapped in markdown fences, prefixed with prose, or followed by extra
// text or a duplicated object. Brace-counting (string-aware) avoids grabbing a
// stray trailing `}` that a naive lastIndexOf would.
export const extractJsonObject = (text: string): unknown => {
  const cleaned = text.replace(/```(?:json)?/gi, '');
  const start = cleaned.indexOf('{');
  if (start === -1) {
    throw new Error('No JSON object found in model output');
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;
  for (let i = start; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  const candidate = end === -1 ? cleaned.slice(start) : cleaned.slice(start, end);
  try {
    return JSON.parse(candidate);
  } catch {
    // Common repair: trailing commas before } or ]
    return JSON.parse(candidate.replace(/,\s*([}\]])/g, '$1'));
  }
};

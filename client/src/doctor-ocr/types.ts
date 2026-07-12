export type MarkerStatus =
  | 'low'
  | 'normal'
  | 'high'
  | 'critical-low'
  | 'critical-high'
  | 'abnormal'
  | 'unknown';

export interface AnalyzedMarker {
  id: string;
  originalName: string;
  label: string;
  testCode: string | null;
  rawValue: string;
  numericValue: number | null;
  unit: string | null;
  referenceRange: { raw: string | null; minimum: number | null; maximum: number | null };
  status: MarkerStatus;
  reportFlag: string | null;
  explanation: string;
  resultInterpretation: string;
  confidence: number;
  sourcePage: number | null;
  warnings: string[];
}

export interface SuggestedDoctorQuestion {
  id: string;
  question: string;
  reason: string;
  relatedMarkerIds: string[];
}

export interface AnalysisResult {
  schemaVersion: string;
  analysisId: string;
  status: 'completed' | 'partial';
  source: {
    fileName: string;
    fileType: string;
    pageCount: number;
    uploadedAt: string;
    analyzedAt: string;
    ocrModel: string;
    analysisModel: string;
  };
  report: {
    reportType: string | null;
    medicalSpecialty: string | null;
    laboratoryName: string | null;
    hospitalName: string | null;
    reportNumber: string | null;
    sampleCollectedAt: string | null;
    reportIssuedAt: string | null;
  };
  patient: {
    name: string | null;
    age: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    patientId: string | null;
  };
  doctor: {
    name: string | null;
    specialty: string | null;
    clinicOrHospital: string | null;
  };
  markers: AnalyzedMarker[];
  summary: {
    overview: string;
    importantFindings: string[];
    normalFindings: string[];
    pointsToDiscussWithDoctor: string[];
    urgency: 'routine' | 'soon' | 'prompt';
    disclaimer: string;
  };
  suggestedDoctorQuestions: SuggestedDoctorQuestion[];
  quality: {
    overallConfidence: number;
    missingInformation: string[];
    warnings: string[];
    requiresManualReview: boolean;
  };
}

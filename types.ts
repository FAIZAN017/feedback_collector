
export enum QuestionType {
  TEXT = 'TEXT',
  RATING = 'RATING',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  YES_NO = 'YES_NO'
}

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[]; // For MULTIPLE_CHOICE
}

export interface Form {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: number;
  authorId?: string;
  isPublished: boolean;
}

export interface Answer {
  questionId: string;
  value: string | number | boolean;
}

export interface FormResponse {
  id: string;
  formId: string;
  answers: Answer[];
  submittedAt: number;
  respondentName?: string; // Optional if not anonymous
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface FormSummary {
  id: string;
  formId: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  sentimentScore: number;
  generatedAt: number;
}

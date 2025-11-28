export interface Rubric {
  id: string;
  name: string;
  description: string;
  criteria: string;
}

export interface Example {
  id: string;
  content: string;
  type: 'Higher Order' | 'Lower Order';
  explanation: string;
}

export interface AnalysisResult {
  isHigherOrder: boolean;
  bloomLevel: string;
  score: number;
  feedback: string;
  improvementSuggestions: string[];
  betterQuestionExample: string;
  analyzedContent: string;
}

export enum BloomLevel {
  Remember = "Remember",
  Understand = "Understand",
  Apply = "Apply",
  Analyze = "Analyze",
  Evaluate = "Evaluate",
  Create = "Create"
}
import { apiService } from '../../../shared/services/apiService';

export interface RankItem {
  id: number;
  name: string;
}

export interface ReviewSetItem {
  id: number;
  name: string;
  setIndex: number;
  totalQuestions: number;
}

export interface ReviewQuestion {
  id: number;
  number: number;
  answer: number;       // 1-based correct option
  totalOptions: number;
  URLImage?: string;
  tip?: string;         // Mẹo nhớ nhanh — shown when user answers wrong
  reason?: string;      // Lý do / Luật — shown below tip
  review_set_question?: { orderIndex: number };
}

export interface ReviewSetDetail {
  id: number;
  name: string;
  setIndex: number;
  rank: { id: number; name: string };
  questions: ReviewQuestion[];
}

export const reviewApi = {
  getRanks: () =>
    apiService.get<RankItem[]>('/api/rank/getRank'),

  getReviewSetsByRank: (rankId: number) =>
    apiService.get<ReviewSetItem[]>(`/api/review/sets/${rankId}`),

  getReviewSetQuestions: (setId: number) =>
    apiService.get<ReviewSetDetail>(`/api/review/set/${setId}/questions`),

  generateReviewSets: (rankId: number) =>
    apiService.post(`/api/review/sets/generate/${rankId}`),

  importTips: (tips: { number: number; tip: string }[]) =>
    apiService.post('/api/review/tips/import', { tips } as unknown as Record<string, unknown>),
};

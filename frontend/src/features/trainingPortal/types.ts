export type TrainingApiResponse = {
  EC: number;
  EM: string;
  DT: unknown;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

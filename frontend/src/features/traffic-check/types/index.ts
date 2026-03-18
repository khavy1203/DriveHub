export interface VehicleType {
  value: string;
  label: string;
  icon: string;
}

export type TrafficApiRawResult =
  | string
  | {
      resultHtml?: string;
      data?: string;
      message?: string;
    };

export interface TrafficCheckResponse {
  success: boolean;
  resultHtml?: string;
  message?: string;
}

export type CapacityLevel = "available" | "busy" | "full" | "unknown";

export interface Hospital {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  distanceKm: number;
  etaMin: number;
  capacity: CapacityLevel;
  bedsAvailable: number;
  bedsTotal: number;
  address: string;
  tel: string;
  tags: string[];
}

export interface HospitalSearchRequest {
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
}

export interface HospitalSearchResponse {
  source: "public-data" | "mock";
  hospitals: Hospital[];
  generatedAt: string;
}

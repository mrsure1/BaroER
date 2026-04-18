/**
 * Mock data for the search results UI. Will be replaced with the real
 * /api/v1/hospitals/search proxy → 공공데이터포털 응급의료정보 API in
 * the next iteration.
 */

export type CapacityLevel = "available" | "busy" | "full";

export interface MockHospital {
  id: string;
  name: string;
  type: string;
  distanceKm: number;
  etaMin: number;
  capacity: CapacityLevel;
  bedsAvailable: number;
  bedsTotal: number;
  address: string;
  tel: string;
  tags: string[];
}

export const MOCK_HOSPITALS: MockHospital[] = [
  {
    id: "h1",
    name: "서울대학교병원",
    type: "권역응급의료센터",
    distanceKm: 1.2,
    etaMin: 6,
    capacity: "available",
    bedsAvailable: 8,
    bedsTotal: 24,
    address: "서울 종로구 대학로 101",
    tel: "02-2072-2114",
    tags: ["권역", "외상센터", "심혈관"],
  },
  {
    id: "h2",
    name: "강북삼성병원",
    type: "지역응급의료센터",
    distanceKm: 2.4,
    etaMin: 11,
    capacity: "busy",
    bedsAvailable: 2,
    bedsTotal: 18,
    address: "서울 종로구 새문안로 29",
    tel: "02-2001-2001",
    tags: ["지역", "심혈관"],
  },
  {
    id: "h3",
    name: "고려대학교 안암병원",
    type: "권역응급의료센터",
    distanceKm: 3.1,
    etaMin: 14,
    capacity: "available",
    bedsAvailable: 12,
    bedsTotal: 30,
    address: "서울 성북구 인촌로 73",
    tel: "02-920-5114",
    tags: ["권역", "외상센터", "소아"],
  },
  {
    id: "h4",
    name: "세브란스병원",
    type: "권역응급의료센터",
    distanceKm: 4.8,
    etaMin: 18,
    capacity: "full",
    bedsAvailable: 0,
    bedsTotal: 28,
    address: "서울 서대문구 연세로 50-1",
    tel: "02-1599-1004",
    tags: ["권역", "외상센터"],
  },
  {
    id: "h5",
    name: "이대목동병원",
    type: "지역응급의료기관",
    distanceKm: 5.6,
    etaMin: 22,
    capacity: "available",
    bedsAvailable: 5,
    bedsTotal: 14,
    address: "서울 양천구 안양천로 1071",
    tel: "02-2650-5114",
    tags: ["지역"],
  },
];

export const CAPACITY_META: Record<
  CapacityLevel,
  { label: string; tone: string; ring: string; dot: string }
> = {
  available: {
    label: "수용 가능",
    tone: "text-status-available bg-status-available-soft",
    ring: "ring-status-available/30",
    dot: "bg-status-available",
  },
  busy: {
    label: "혼잡",
    tone: "text-status-busy bg-status-busy-soft",
    ring: "ring-status-busy/30",
    dot: "bg-status-busy",
  },
  full: {
    label: "수용 불가",
    tone: "text-status-full bg-status-full-soft",
    ring: "ring-status-full/30",
    dot: "bg-status-full",
  },
};

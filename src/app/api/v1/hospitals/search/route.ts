import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type {
  CapacityLevel,
  Hospital,
  HospitalSearchResponse,
} from "@/types/hospital";
import { MOCK_HOSPITALS } from "@/lib/mockHospitals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICE_KEY = process.env.PUBLIC_DATA_PORTAL_SERVICE_KEY ?? "";
/** 공공데이터포털 응급의료정보 — 위치 기반 응급실 조회 */
const ENDPOINT =
  "https://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytLcinfoInqire";

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.5).max(50).default(10),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** 두 좌표 간 거리(km) — Haversine */
function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** 거리 → 도심 평균 주행 25km/h 가정 ETA */
function estimateEtaMin(km: number) {
  return Math.max(2, Math.round((km / 25) * 60));
}

function classifyCapacity(available: number, total: number): CapacityLevel {
  if (total <= 0 || Number.isNaN(available)) return "unknown";
  if (available <= 0) return "full";
  if (available / total < 0.2) return "busy";
  return "available";
}

interface PublicDataItem {
  hpid?: string;
  dutyName?: string;
  dutyAddr?: string;
  dutyTel3?: string;
  wgs84Lat?: string | number;
  wgs84Lon?: string | number;
  hvec?: string | number;
  hperyn?: string;
  dutyEmcls?: string;
}

function mapItem(
  it: PublicDataItem,
  origin: { lat: number; lng: number },
): Hospital | null {
  const lat = Number(it.wgs84Lat);
  const lng = Number(it.wgs84Lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const distanceKm = haversineKm(origin, { lat, lng });
  const bedsAvailable = Number(it.hvec ?? 0);
  const bedsTotal = bedsAvailable >= 0 ? Math.max(bedsAvailable, 10) : 0;
  return {
    id: it.hpid ?? `${lat},${lng}`,
    name: it.dutyName ?? "응급의료기관",
    type: it.dutyEmcls ?? "응급의료기관",
    lat,
    lng,
    distanceKm,
    etaMin: estimateEtaMin(distanceKm),
    capacity: classifyCapacity(bedsAvailable, bedsTotal),
    bedsAvailable,
    bedsTotal,
    address: it.dutyAddr ?? "",
    tel: it.dutyTel3 ?? "",
    tags: [],
  };
}

function mockResponse(
  origin: { lat: number; lng: number },
  limit: number,
): HospitalSearchResponse {
  const hospitals: Hospital[] = MOCK_HOSPITALS.slice(0, limit).map((m, i) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    lat: 37.5665 + (i - 2) * 0.01,
    lng: 126.978 + (i - 2) * 0.012,
    distanceKm: m.distanceKm,
    etaMin: m.etaMin,
    capacity: m.capacity,
    bedsAvailable: m.bedsAvailable,
    bedsTotal: m.bedsTotal,
    address: m.address,
    tel: m.tel,
    tags: m.tags,
  }));
  return {
    source: "mock",
    hospitals,
    generatedAt: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const parsed = QuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_QUERY", details: parsed.error.format() },
      { status: 400 },
    );
  }
  const { lat, lng, radiusKm, limit } = parsed.data;
  const origin = { lat, lng };

  if (!SERVICE_KEY) {
    return NextResponse.json(mockResponse(origin, limit), {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const url = new URL(ENDPOINT);
  url.searchParams.set("serviceKey", SERVICE_KEY);
  url.searchParams.set("WGS84_LON", String(lng));
  url.searchParams.set("WGS84_LAT", String(lat));
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", String(limit));
  url.searchParams.set("_type", "json");

  try {
    const upstream = await fetch(url, {
      next: { revalidate: 30 },
      headers: { Accept: "application/json" },
    });
    if (!upstream.ok) {
      return NextResponse.json(mockResponse(origin, limit), { status: 200 });
    }
    const body = (await upstream.json()) as {
      response?: {
        body?: {
          items?: { item?: PublicDataItem | PublicDataItem[] };
          totalCount?: number;
        };
      };
    };
    const raw = body.response?.body?.items?.item ?? [];
    const items: PublicDataItem[] = Array.isArray(raw) ? raw : [raw];
    const hospitals = items
      .map((it) => mapItem(it, origin))
      .filter((h): h is Hospital => h !== null)
      .filter((h) => h.distanceKm <= radiusKm)
      .sort((a, b) => a.etaMin - b.etaMin)
      .slice(0, limit);

    const out: HospitalSearchResponse = {
      source: "public-data",
      hospitals,
      generatedAt: new Date().toISOString(),
    };
    return NextResponse.json(out, {
      status: 200,
      headers: { "Cache-Control": "private, max-age=15" },
    });
  } catch {
    return NextResponse.json(mockResponse(origin, limit), { status: 200 });
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

/**
 * 좌표 → 한글 주소 변환 (네이버 Reverse Geocoding API).
 *
 * - 클라이언트가 `/api/v1/geocode/reverse?lat=&lng=` 로 호출.
 * - 네이버 NCP Maps Reverse Geocoding (도로명/법정동) 을 서버 사이드에서 호출해
 *   Secret 을 노출하지 않는다.
 * - 주소 미확인·오류여도 500 을 내지 않고 `{ address: null }` 을 리턴해 UI 가
 *   좌표 폴백으로 자연스럽게 떨어지게 설계했다.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Query = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lng: z.coerce.number().gte(-180).lte(180),
});

interface NaverArea {
  name?: string;
}
interface NaverLand {
  name?: string;
  number1?: string;
  number2?: string;
  addition0?: { value?: string };
}
interface NaverReverseResult {
  name: string;
  region?: {
    area0?: NaverArea;
    area1?: NaverArea;
    area2?: NaverArea;
    area3?: NaverArea;
    area4?: NaverArea;
  };
  land?: NaverLand;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const parsed = Query.safeParse({
    lat: sp.get("lat"),
    lng: sp.get("lng"),
  });
  if (!parsed.success) {
    return NextResponse.json({ address: null, error: "invalid_params" }, { status: 400 });
  }
  const { lat, lng } = parsed.data;

  const keyId = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!keyId || !secret) {
    return NextResponse.json({ address: null, error: "not_configured" });
  }

  const url = new URL("https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc");
  url.searchParams.set("coords", `${lng},${lat}`);
  url.searchParams.set("orders", "roadaddr,addr");
  url.searchParams.set("output", "json");

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-ncp-apigw-api-key-id": keyId,
        "x-ncp-apigw-api-key": secret,
      },
      // 60 초 캐시 — 같은 근처 좌표 재호출이 잦음
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json({ address: null, error: `upstream_${res.status}` });
    }
    const data = (await res.json()) as {
      results?: NaverReverseResult[];
      status?: { code: number };
    };
    const address = pickBestAddress(data.results ?? []);
    return NextResponse.json({ address });
  } catch {
    return NextResponse.json({ address: null, error: "network" });
  }
}

/** 도로명(roadaddr) 이 있으면 우선, 없으면 지번(addr) — 둘 다 없으면 null. */
function pickBestAddress(results: NaverReverseResult[]): string | null {
  const road = results.find((r) => r.name === "roadaddr");
  if (road) return formatRoad(road);
  const jibun = results.find((r) => r.name === "addr");
  if (jibun) return formatJibun(jibun);
  return null;
}

function formatRoad(r: NaverReverseResult): string | null {
  const region = r.region;
  const land = r.land;
  if (!region || !land) return null;
  // 시/도 · 시·군·구 · 도로명 · 본번(-부번) [건물명]
  const parts = [
    region.area1?.name,
    region.area2?.name,
    land.name,
    [land.number1, land.number2].filter(Boolean).join("-") || undefined,
  ]
    .filter(Boolean)
    .join(" ");
  const building = land.addition0?.value;
  return building ? `${parts} (${building})` : parts || null;
}

function formatJibun(r: NaverReverseResult): string | null {
  const region = r.region;
  const land = r.land;
  if (!region) return null;
  const ri = region.area4?.name;
  const dong = region.area3?.name;
  const gu = region.area2?.name;
  const si = region.area1?.name;
  const jibun = [land?.number1, land?.number2].filter(Boolean).join("-");
  const parts = [si, gu, dong, ri, jibun].filter(Boolean).join(" ");
  return parts || null;
}

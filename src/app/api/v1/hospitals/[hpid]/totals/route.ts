import { NextRequest, NextResponse } from "next/server";
import type { BedTotals } from "@/types/hospital";

export const runtime = "nodejs";

const SERVICE_KEY =
  process.env.DATA_SERVICE_KEY ??
  process.env.PUBLIC_DATA_PORTAL_SERVICE_KEY ??
  "";

const BASS_ENDPOINT =
  "https://apis.data.go.kr/B552657/ErmctInfoInqireService/getEgytBassInfoInqire";

interface BassItem {
  hpid?: string;
  hperyn?: string | number;
  hpgryn?: string | number;
  hpopyn?: string | number;
  hpicuyn?: string | number;
  hpnicuyn?: string | number;
  hpbdn?: string | number;
}

interface PublicDataEnvelope<T> {
  response?: {
    body?: {
      items?: { item?: T | T[] } | "";
    };
  };
}

function parseCount(v: string | number | undefined): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function toBedTotals(it: BassItem): BedTotals {
  return {
    er: parseCount(it.hperyn),
    general: parseCount(it.hpgryn),
    surgery: parseCount(it.hpopyn),
    icu: parseCount(it.hpicuyn),
    nicu: parseCount(it.hpnicuyn),
    total: parseCount(it.hpbdn),
  };
}

/**
 * 응급실 기본정보(정원 등)를 hpid 단위로 lazy 조회.
 *
 * 메인 검색(`/api/v1/hospitals/search`) 에서는 응답 속도를 위해 정원 정보를
 * 빼고 보내며, 사용자가 카드를 펼치는 등 정원이 실제로 필요해지는 시점에
 * 이 엔드포인트로 단건 호출한다. 정원은 사실상 불변이므로 24시간 캐싱.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ hpid: string }> },
) {
  const { hpid } = await ctx.params;
  if (!hpid) {
    return NextResponse.json({ error: "INVALID_HPID" }, { status: 400 });
  }
  if (!SERVICE_KEY) {
    return NextResponse.json({ totals: null }, { status: 200 });
  }

  const url = new URL(BASS_ENDPOINT);
  url.searchParams.set("serviceKey", SERVICE_KEY);
  url.searchParams.set("HPID", hpid);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "1");
  url.searchParams.set("_type", "json");

  try {
    const res = await fetch(url, {
      next: { revalidate: 86_400, tags: [`bass:${hpid}`] },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json({ totals: null }, { status: 200 });
    }
    const body = (await res.json()) as PublicDataEnvelope<BassItem>;
    const raw = body?.response?.body?.items;
    if (!raw || raw === "") {
      return NextResponse.json({ totals: null }, { status: 200 });
    }
    const item = raw.item;
    if (!item) {
      return NextResponse.json({ totals: null }, { status: 200 });
    }
    const it = Array.isArray(item) ? item[0] : item;
    const totals = toBedTotals(it);
    return NextResponse.json(
      { totals },
      {
        status: 200,
        // 클라이언트 / CDN 캐시. 정원 정보는 거의 변하지 않음.
        headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
      },
    );
  } catch {
    return NextResponse.json({ totals: null }, { status: 200 });
  }
}

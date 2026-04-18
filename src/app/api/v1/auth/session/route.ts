import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAvailable, getAdminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "session";
const COOKIE_TTL_DAYS = 5;

const PostBody = z.object({
  idToken: z.string().min(20),
});

/**
 * Exchange a Firebase ID token (obtained on the client via signInWithEmailAndPassword,
 * Google, Kakao→custom token, etc.) for a long-lived HTTP-only session cookie.
 *
 * The cookie is set as Secure + HttpOnly + SameSite=Lax so it can be read by
 * server middleware on subsequent requests without exposure to JS.
 */
export async function POST(req: NextRequest) {
  if (!adminAvailable()) {
    return NextResponse.json(
      { error: "AUTH_NOT_CONFIGURED", message: "Firebase Admin 환경변수가 설정되지 않았습니다." },
      { status: 503 },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const parsed = PostBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const auth = getAdminAuth();
  if (!auth) {
    return NextResponse.json({ error: "AUTH_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    await auth.verifyIdToken(parsed.data.idToken, true);
    const expiresIn = COOKIE_TTL_DAYS * 24 * 60 * 60 * 1000;
    const sessionCookie = await auth.createSessionCookie(parsed.data.idToken, {
      expiresIn,
    });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresIn / 1000),
    });
    return res;
  } catch {
    return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

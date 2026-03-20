import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // MVP placeholder: ready for Supabase integration later.
  // Expect: { email: string }
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Payload de solicitação inválido." }, { status: 400 });
  }

  const email = typeof (body as any)?.email === "string" ? (body as any).email.trim() : "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, message: "Por favor, digite um e-mail válido." }, { status: 400 });
  }

  // If Supabase env is not configured, still return success to keep UI friendly.
  return NextResponse.json({
    ok: true,
    message: "Se o e-mail existir, você receberá um link em breve.",
    stub: true,
  });
}


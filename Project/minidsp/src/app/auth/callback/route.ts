import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/reset-password";
  }
  return value;
}

export async function GET(request: NextRequest): Promise<Response> {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));
  const supabase = await createClient();

  if (!supabase || !code) {
    return NextResponse.redirect(new URL("/?authError=recovery-link-invalid", request.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/?authError=recovery-link-invalid", request.url));
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server-client";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requested = request.nextUrl.searchParams.get("next") ?? "/compte";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/compte";

  if (code) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, request.url));
    }
  }

  const errorUrl = new URL("/connexion", request.url);
  errorUrl.searchParams.set("erreur", "lien_invalide");
  return NextResponse.redirect(errorUrl);
}

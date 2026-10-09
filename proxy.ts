import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function redirectWithCookies(request: NextRequest, response: NextResponse, pathname: string) {
  const target = request.nextUrl.clone();
  target.pathname = pathname;
  const redirect = NextResponse.redirect(target);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requiresAuth = [
    "/compte",
    "/messages",
    "/voyages",
    "/publier",
    "/gestion",
    "/admin",
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!url || !key) {
    if (requiresAuth) {
      return new NextResponse("Service temporairement indisponible.", {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (requiresAuth && !user) {
    const target = request.nextUrl.clone();
    target.pathname = "/connexion";
    target.search = "";
    target.searchParams.set("retour", `${pathname}${request.nextUrl.search}`);
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (pathname.startsWith("/admin") && user?.app_metadata?.role !== "admin") {
    return redirectWithCookies(request, response, "/");
  }

  if (
    (pathname.startsWith("/gestion") || pathname.startsWith("/publier"))
    && user?.app_metadata?.role !== "admin"
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type, identity_status")
      .eq("id", user!.id)
      .maybeSingle();
    if (
      !profile
      || !["proprietaire", "agence"].includes(profile.account_type)
      || profile.identity_status !== "verifie"
    ) {
      return redirectWithCookies(request, response, "/compte");
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|icon-192.png|icon-512.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};

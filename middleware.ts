import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value, c);
  });
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(request, response);
  if (!supabase) return response;

  const pathname = request.nextUrl.pathname;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const res = NextResponse.redirect(url);
    copyCookies(response, res);
    return res;
  }

  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isAdminRoute = pathname.startsWith("/admin");

  if (!isAdminRoute && !isOnboardingRoute) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("name,phone")
      .eq("id", user.id)
      .maybeSingle();

    const name = typeof profile?.name === "string" ? profile.name.trim() : "";
    const phone = typeof profile?.phone === "string" ? profile.phone.trim() : "";
    const isMissingProfile = Boolean(error) || !profile;

    if (isMissingProfile || name.length < 2 || phone.length < 8) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      url.searchParams.set("next", pathname);
      const res = NextResponse.redirect(url);
      copyCookies(response, res);
      return res;
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/request-help/:path*",
    "/donate/:slug/pay/:path*",
    "/notifications/:path*",
    "/onboarding/:path*",
  ],
};

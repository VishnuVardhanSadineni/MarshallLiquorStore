import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";


const AUTH_ROUTES = [
  "/dashboard",
  "/products",
  "/team",
  "/categories",
  "/orders",
];
const ADMIN_ONLY_PREFIXES = ["/products/new", "/team", "/categories"];


export async function middleware(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const isAuthRoute = AUTH_ROUTES.some(
    (base) => path === base || path.startsWith(`${base}/`)
  );

  if (isAuthRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && ADMIN_ONLY_PREFIXES.some((p) => path.startsWith(p))) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (data?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/products";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static assets and Next internals.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

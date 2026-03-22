import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getUserContext, isInternalWorkspacePath, resolvePostAuthPath } from "@/lib/auth/user-context";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

function applySupabaseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
  return to;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        } catch {
          /* ignore: cookies somente leitura neste contexto */
        }
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
    }
    if (pathname === "/login" || pathname.startsWith("/login/")) {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  const ctx = await getUserContext(supabase, user);

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = resolvePostAuthPath(ctx);
    return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    const url = request.nextUrl.clone();
    url.pathname = resolvePostAuthPath(ctx);
    return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (ctx.isNutritionist && pathname.startsWith("/meu-plano")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (ctx.isPatient && !ctx.isNutritionist && isInternalWorkspacePath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/meu-plano";
    return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

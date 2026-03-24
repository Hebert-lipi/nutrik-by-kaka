import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getUserContext,
  isInternalWorkspacePath,
  parseEntryIntent,
  resolvePostAuthPath,
} from "@/lib/auth/user-context";
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
  const intent = parseEntryIntent(request.cookies.get("nutrik_entry_intent")?.value);

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

  if (pathname === "/profissional/como-usa" || pathname.startsWith("/profissional/como-usa/")) {
    if (ctx.isClinicalStaff) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
    }
    if (intent === "patient") {
      const url = request.nextUrl.clone();
      url.pathname = "/meu-plano";
      return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
    }
  }

  if (
    pathname === "/acesso-profissional" ||
    pathname.startsWith("/acesso-profissional/") ||
    pathname === "/solicitar-acesso-profissional" ||
    pathname.startsWith("/solicitar-acesso-profissional/")
  ) {
    if (intent !== "professional") {
      const url = request.nextUrl.clone();
      url.pathname = "/meu-plano";
      return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
    }
    if (ctx.isClinicalStaff) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
    }
    if (ctx.onboardingProfessionalChoice !== "clinic") {
      const url = request.nextUrl.clone();
      url.pathname = "/profissional/como-usa";
      return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
    }
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = resolvePostAuthPath(ctx, intent);
    return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    const url = request.nextUrl.clone();
    url.pathname = resolvePostAuthPath(ctx, intent);
    return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  // Staff clínico sem ficha de paciente: portal não se aplica.
  if (ctx.isClinicalStaff && !ctx.isPatient && pathname.startsWith("/meu-plano")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  // Sem role clínico: não acede à área interna nem PDF clínico (autorização explícita).
  if (!ctx.isClinicalStaff && isInternalWorkspacePath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = intent === "professional" ? "/profissional/como-usa" : "/meu-plano";
    return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

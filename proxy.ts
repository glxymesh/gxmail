import { NextResponse, type NextRequest } from "next/server"

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public routes
  const publicRoutes = ["/", "/login"]
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/accounts") // Account linking callbacks

  // Onboarding is accessible only when authenticated
  const isOnboarding = pathname === "/onboarding"

  // Check for NextAuth session cookie
  const sessionCookie =
    req.cookies.get("__Secure-authjs.session-token") ||
    req.cookies.get("authjs.session-token") ||
    req.cookies.get("__Secure-next-auth.session-token") ||
    req.cookies.get("next-auth.session-token")

  const isAuthenticated = !!sessionCookie?.value

  // Unauthenticated → login (except public routes)
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Authenticated + landing/login → inbox
  if (isAuthenticated && (pathname === "/" || pathname === "/login")) {
    return NextResponse.redirect(new URL("/inbox", req.url))
  }

  // Check onboarding status via cookie flag
  // (set by the mail layout after checking linked accounts)
  const hasLinkedAccounts = req.cookies.get("gxmail-has-accounts")?.value === "1"

  // Authenticated + no linked accounts + not on onboarding/api → onboarding
  if (
    isAuthenticated &&
    !hasLinkedAccounts &&
    !isOnboarding &&
    !isPublicRoute &&
    !pathname.startsWith("/api/")
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

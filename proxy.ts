import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const PROTECTED_ROUTES = ["/dashboard", "/coach", "/onboarding"]
const PUBLIC_ROUTES = ["/", "/login", "/signup"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public API routes without auth
  if (pathname.startsWith("/api/")) {
    return NextResponse.next({ request })
  }

  const { response, user } = await updateSession(request)

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from login/signup
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and Next.js internals
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

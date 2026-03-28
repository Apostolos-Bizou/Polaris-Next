import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes — only admin role
    if (path.startsWith("/dashboard") || path.startsWith("/clients") ||
        path.startsWith("/offers") || path.startsWith("/contracts") ||
        path.startsWith("/email") || path.startsWith("/reports") ||
        path.startsWith("/renewals") || path.startsWith("/ceo-finance") ||
        path.startsWith("/follow-ups") || path.startsWith("/settings")) {
      if (token?.role !== "admin") {
        return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
      }
    }

    // Client portal routes — only client role
    if (path.startsWith("/portal")) {
      if (token?.role !== "client") {
        return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        // Allow access if user has a valid token
        return !!token;
      },
    },
  }
);

// ─── Routes that require authentication ─────────────────
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/members/:path*",
    "/offers/:path*",
    "/contracts/:path*",
    "/email/:path*",
    "/reports/:path*",
    "/renewals/:path*",
    "/ceo-finance/:path*",
    "/follow-ups/:path*",
    "/settings/:path*",
    "/portal/:path*",
  ],
};

import { NextResponse } from "next/server";

const SESSION_COOKIE = "tool_manager_session";

export function proxy(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isLogin = request.nextUrl.pathname === "/login";
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLogin && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*"],
};

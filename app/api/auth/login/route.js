import { NextResponse } from "next/server";
import { createSessionToken, isValidAdminLogin, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!isValidAdminLogin(username, password)) {
    return NextResponse.json(
      {
        success: false,
        message: "Sai tài khoản hoặc mật khẩu.",
      },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    success: true,
    message: "Đăng nhập thành công.",
  });

  response.cookies.set({
    name: SESSION_COOKIE,
    value: createSessionToken(username),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // ✅ 临时关闭所有权限拦截
  return NextResponse.next();
}

// ⚠️ 这段保留（如果有的话）
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

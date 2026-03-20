import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function updateSession(_request: NextRequest) {
  return NextResponse.next();
}

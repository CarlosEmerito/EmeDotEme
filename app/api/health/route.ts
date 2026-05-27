import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "healthy", db: "connected" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "unhealthy", db: "disconnected" }, { status: 503 });
  }
}

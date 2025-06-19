import { NextResponse } from "next/server";
import { prisma, withRetry } from "~/lib/prisma";

export async function GET() {
  try {
    // Simple database connectivity test
    await withRetry(async () => {
      return await prisma.$queryRaw`SELECT 1`;
    });

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}

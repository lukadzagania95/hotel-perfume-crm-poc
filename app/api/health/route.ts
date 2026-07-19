import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmailSettings } from "@/lib/emailTransport";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const settings = getEmailSettings();
    return NextResponse.json({
      status: "ok",
      database: "ok",
      emailDeliveryMode: settings.mode,
      liveDeliveryUnlocked: settings.mode === "live" && settings.liveSendEnabled,
    });
  } catch {
    return NextResponse.json({ status: "error", database: "unavailable" }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { runEmailAutomation } from "@/lib/emailAutomation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await runEmailAutomation({ source: "scheduled" }));
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Outbound automation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

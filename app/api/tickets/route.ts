import { NextResponse } from "next/server";

import { getOperatingMode, getTickets } from "@/lib/ticketing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tickets = await getTickets();
    return NextResponse.json({
      success: true,
      mode: getOperatingMode(),
      data: tickets
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải được danh sách vé."
      },
      { status: 500 }
    );
  }
}

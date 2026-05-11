import { NextResponse } from "next/server";

import { validateVoucher } from "@/lib/ticketing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { voucher?: string };
    const data = await validateVoucher(body.voucher ?? "");
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Mã giảm giá không hợp lệ."
      },
      { status: 400 }
    );
  }
}

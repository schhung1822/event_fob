import { NextResponse } from "next/server";

import { markOrderPaid } from "@/lib/ticketing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { orderId?: string; secret?: string };
    const secret = process.env.BS_PAYMENT_WEBHOOK_SECRET;

    if (secret && body.secret !== secret) {
      return NextResponse.json(
        {
          success: false,
          error: "Secret không hợp lệ."
        },
        { status: 401 }
      );
    }

    if (!body.orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu orderId."
        },
        { status: 400 }
      );
    }

    await markOrderPaid(body.orderId);

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Không thể cập nhật được thanh toán."
      },
      { status: 500 }
    );
  }
}

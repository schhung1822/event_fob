import { NextResponse } from "next/server";

import { checkPaymentStatus } from "@/lib/ticketing";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const body = (await request.json().catch(() => ({}))) as { manual?: boolean };
    const data = await checkPaymentStatus(params.orderId, Boolean(body.manual));

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Không thể kiểm tra được trạng thái thanh toán."
      },
      { status: 500 }
    );
  }
}

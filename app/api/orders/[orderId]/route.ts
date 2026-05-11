import { NextResponse } from "next/server";

import { getOrderDetail } from "@/lib/ticketing";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const data = await getOrderDetail(params.orderId);
    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "Không có dữ liệu đơn hàng."
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải được đơn hàng."
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

import { buildRequestMeta, createOrder } from "@/lib/ticketing";
import type { CreateOrderInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Omit<
      CreateOrderInput,
      "userAgent" | "clientIp"
    >;
    const meta = buildRequestMeta(request.headers);
    const data = await createOrder({
      ...body,
      userAgent: meta.userAgent,
      clientIp: meta.clientIp
    });

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tạo được đơn hàng."
      },
      { status: 400 }
    );
  }
}

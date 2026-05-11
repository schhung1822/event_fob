import "server-only";

import type { PoolConnection, RowDataPacket } from "mysql2/promise";

import { getDatabasePool, hasDatabaseConfig } from "@/lib/db";
import {
  decreaseMockVoucher,
  getMockOrder,
  getMockTickets,
  getMockVoucher,
  hasMockOrderCode,
  hasMockOrderId,
  markMockOrderPaid,
  saveMockOrder
} from "@/lib/mock-store";
import type {
  CartTicketInput,
  CreateOrderInput,
  CreatedOrder,
  OrderDetail,
  OrderRecord,
  PaymentStatus,
  Ticket,
  ValidatedVoucher
} from "@/lib/types";
import {
  compareDbDateString,
  generateCode,
  getVietnamNowString,
  isPaidStatus,
  normalizePhone,
  upperVi
} from "@/lib/utils";

type TicketRow = RowDataPacket & {
  id: number;
  ticket_id: string;
  img: string | null;
  name: string;
  money: number;
  money_sale: number | null;
};

type VoucherRow = RowDataPacket & {
  voucher: string;
  classy: "money" | "rate";
  class: string | null;
  money: number | null;
  rate: number | null;
  number: number | null;
  from_date: string | null;
  to_date: string | null;
};

type OrderRow = RowDataPacket & {
  ordercode: string;
  order_id: string;
  create_time: string;
  name: string;
  phone: string;
  email: string;
  gender: string;
  class: string;
  money: number;
  status: string;
};

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function toTicket(row: TicketRow): Ticket {
  return {
    id: Number(row.id),
    ticketId: row.ticket_id,
    img: row.img || "",
    name: row.name,
    money: Number(row.money),
    moneySale: row.money_sale === null ? null : Number(row.money_sale)
  };
}

function toValidatedVoucher(row: {
  classy: "money" | "rate";
  class: string | null;
  money: number | null;
  rate: number | null;
  voucher: string;
}) {
  return {
    classy: row.classy,
    class: row.class?.trim() || "",
    money: row.money === null ? null : Number(row.money),
    rate: row.rate === null ? null : Number(row.rate),
    voucher: row.voucher.trim()
  } satisfies ValidatedVoucher;
}

function assertVoucherActive(voucher: {
  fromDate: string | null;
  toDate: string | null;
  number: number | null;
}) {
  const now = getVietnamNowString();
  const fromDate = voucher.fromDate ?? "";
  const toDate = voucher.toDate ?? "";

  const hasFromDate =
    fromDate !== "" &&
    fromDate !== "0000-00-00 00:00:00" &&
    fromDate !== "0000-00-00";
  const hasToDate =
    toDate !== "" &&
    toDate !== "0000-00-00 00:00:00" &&
    toDate !== "0000-00-00";

  if (hasFromDate && compareDbDateString(now, fromDate) < 0) {
    throw new Error("Ma giam gia chua co hieu luc.");
  }

  if (hasToDate && compareDbDateString(now, toDate) > 0) {
    throw new Error("Ma giam gia da het han.");
  }

  if (voucher.number !== null && voucher.number <= 0) {
    throw new Error("Ma giam gia da het luot su dung.");
  }
}

function createClientIp(headers: Headers) {
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
    headers.get("x-forwarded-for")
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const first = candidate.split(",")[0]?.trim();
    if (first) return first;
  }

  return "0.0.0.0";
}

async function generateUniqueCode(
  prefix: "DH" | "OD",
  connection?: PoolConnection
) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const code = generateCode(prefix);

    if (!connection) {
      const exists =
        prefix === "DH" ? hasMockOrderCode(code) : hasMockOrderId(code);
      if (!exists) return code;
      continue;
    }

    const column = prefix === "DH" ? "ordercode" : "order_id";
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM orders WHERE ${column} = ? LIMIT 1`,
      [code]
    );

    if (rows.length === 0) return code;
  }

  return generateCode(prefix);
}

function validateCreateOrderInput(input: CreateOrderInput) {
  if (!input.name.trim() || !input.phone.trim() || !input.email.trim() || !input.gender) {
    throw new Error("Vui long dien day du: Ho ten, SDT, Email va Gioi tinh.");
  }

  if (!Array.isArray(input.tickets) || input.tickets.length === 0) {
    throw new Error("Vui long chon it nhat 1 ve.");
  }

  const totalQuantity = input.tickets.reduce(
    (sum, ticket) => sum + Math.max(0, Number(ticket.quantity || 0)),
    0
  );

  if (totalQuantity < 1) {
    throw new Error("Vui long chon it nhat 1 ve.");
  }
}

function buildOrderDetail(records: OrderRecord[]): OrderDetail {
  const first = records[0];
  return {
    orderId: first.orderId,
    customerName: first.customerName,
    phone: first.phone,
    email: first.email,
    transferContent: first.transferContent,
    totalMoney: records.reduce((sum, record) => sum + record.money, 0),
    status: records.some((record) => isPaidStatus(record.status)) ? "paydone" : "pending",
    records
  };
}

async function sendRegisterWebhook(payload: Record<string, unknown>) {
  const webhookUrl = process.env.BS_REGISTER_WEBHOOK_URL?.trim().replace(
    /^"(.*)"$/,
    "$1"
  );
  if (!webhookUrl) {
    console.warn("Register webhook skipped: BS_REGISTER_WEBHOOK_URL is empty");
    return;
  }

  try {
    console.info("Sending register webhook", {
      webhookUrl,
      orderId: payload.order_id
    });

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000)
    });

    const responseText = await response.text();
    if (!response.ok) {
      console.error("Register webhook failed", {
        webhookUrl,
        orderId: payload.order_id,
        status: response.status,
        body: responseText
      });
      return;
    }

    console.info("Register webhook delivered", {
      webhookUrl,
      orderId: payload.order_id,
      status: response.status,
      body: responseText
    });
  } catch (error) {
    console.error("Register webhook request error", {
      webhookUrl,
      orderId: payload.order_id,
      error
    });
  }
}

export function getOperatingMode() {
  return hasDatabaseConfig() ? "db" : "mock";
}

export function getBankConfig() {
  return {
    bankName: process.env.NEXT_PUBLIC_BANK_NAME || "ACB",
    bankAccount: process.env.NEXT_PUBLIC_BANK_ACCOUNT || "93956886",
    bankOwner:
      process.env.NEXT_PUBLIC_BANK_OWNER || "CT CP TAP DOAN HOANG TU HOLDINGS",
    qrBase: process.env.NEXT_PUBLIC_BANK_QR_BASE || "https://qr.sepay.vn/img"
  };
}

export async function getTickets() {
  const pool = getDatabasePool();
  if (!pool) {
    return getMockTickets();
  }

  const [rows] = await pool.query<TicketRow[]>(
    "SELECT id, ticket_id, img, name, money, money_sale FROM ticket ORDER BY nc_order ASC, id ASC"
  );

  return rows.map(toTicket);
}

export async function validateVoucher(voucherCode: string) {
  const code = voucherCode.trim();
  if (!code) {
    throw new Error("Vui long nhap ma giam gia.");
  }

  const pool = getDatabasePool();
  if (!pool) {
    const voucher = getMockVoucher(code);
    if (!voucher) {
      throw new Error("Ma giam gia khong hop le.");
    }

    assertVoucherActive({
      fromDate: voucher.fromDate,
      toDate: voucher.toDate,
      number: voucher.number
    });

    return toValidatedVoucher(voucher);
  }

  const [rows] = await pool.query<VoucherRow[]>(
    "SELECT * FROM voucher WHERE voucher = ? LIMIT 1",
    [code]
  );

  const voucher = rows[0];
  if (!voucher) {
    throw new Error("Ma giam gia khong hop le.");
  }

  assertVoucherActive({
    fromDate: voucher.from_date,
    toDate: voucher.to_date,
    number: voucher.number
  });

  return toValidatedVoucher(voucher);
}

export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  validateCreateOrderInput(input);

  const name = input.name.trim();
  const phone = normalizePhone(input.phone.trim());
  const email = input.email.trim();
  const gender = input.gender;
  const career = input.career.trim();
  const hope = input.hope.trim();
  const voucherCode = input.voucherCode?.trim() || "";
  const source = input.source?.trim() || "";
  const ref = input.ref?.trim() || "";
  const utmSource = input.utmSource?.trim() || "";
  const utmMedium = input.utmMedium?.trim() || "";
  const utmCampaign = input.utmCampaign?.trim() || "";
  const fbp = input.fbp?.trim() || "";
  const fbc = input.fbc?.trim() || "";
  const userAgent = input.userAgent?.trim() || "";
  const clientIp = input.clientIp?.trim() || "0.0.0.0";
  const createTime = getVietnamNowString();
  const customerId = `KH${phone.replace(/[^0-9]/g, "")}`;

  let voucherData: ValidatedVoucher | null = null;
  if (voucherCode) {
    voucherData = await validateVoucher(voucherCode);
  }

  let totalRemainingTickets = input.tickets.reduce(
    (sum, ticket) => sum + Math.max(0, Number(ticket.quantity || 0)),
    0
  );
  let remainingCartDiscount =
    voucherData && voucherData.classy === "money" && !voucherData.class
      ? voucherData.money ?? 0
      : 0;

  const pool = getDatabasePool();

  if (!pool) {
    const orderId = await generateUniqueCode("OD");
    const mockRecords: OrderRecord[] = [];
    const webhookTickets: Array<{ ordercode: string; ticket_name: string; price: number }> = [];

    for (const ticket of input.tickets) {
      const quantity = Math.max(0, Number(ticket.quantity || 0));
      for (let index = 0; index < quantity; index += 1) {
        const orderCode = await generateUniqueCode("DH");
        let money = Number(ticket.price || 0);

        if (voucherData) {
          const targetClass = upperVi(voucherData.class);
          const ticketName = upperVi(ticket.name);
          const isTargetClass =
            targetClass !== "" &&
            (ticketName === targetClass || ticketName.includes(targetClass));

          if (voucherData.classy === "rate" && (!targetClass || isTargetClass)) {
            money = Math.round(money * (100 - (voucherData.rate ?? 0)) / 100);
          }

          if (voucherData.classy === "money") {
            if (targetClass) {
              if (isTargetClass) {
                money = Math.max(0, money - (voucherData.money ?? 0));
              }
            } else if (remainingCartDiscount > 0 && totalRemainingTickets > 0) {
              const deduct = Math.min(
                money,
                Math.ceil(remainingCartDiscount / totalRemainingTickets)
              );
              money -= deduct;
              remainingCartDiscount -= deduct;
            }
          }
        }

        if (totalRemainingTickets > 0) {
          totalRemainingTickets -= 1;
        }

        mockRecords.push({
          orderCode,
          orderId,
          createTime,
          customerName: name,
          phone,
          email,
          gender,
          className: ticket.name,
          money,
          status: "new",
          transferContent: orderId
        });

        webhookTickets.push({
          ordercode: orderCode,
          ticket_name: ticket.name,
          price: money
        });
      }
    }

    if (voucherCode) {
      decreaseMockVoucher(voucherCode);
    }

    saveMockOrder(orderId, mockRecords);
    await sendRegisterWebhook({
      order_id: orderId,
      create_time: createTime,
      ref,
      name,
      phone,
      email,
      gender,
      career,
      hope,
      total_tickets: mockRecords.length,
      tickets: webhookTickets,
      source,
      customer_id: customerId,
      voucher: voucherCode || null,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      user_agent: userAgent,
      ip: clientIp,
      fbp,
      fbc
    });

    return {
      orderId,
      redirect: `${getBaseUrl()}/thanh-toan?orderid=${encodeURIComponent(orderId)}`
    };
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const orderId = await generateUniqueCode("OD", connection);
    const webhookTickets: Array<{ ordercode: string; ticket_name: string; price: number }> = [];
    let inserted = 0;

    for (const ticket of input.tickets) {
      const quantity = Math.max(0, Number(ticket.quantity || 0));
      for (let index = 0; index < quantity; index += 1) {
        const orderCode = await generateUniqueCode("DH", connection);
        let money = Number(ticket.price || 0);

        if (voucherData) {
          const targetClass = upperVi(voucherData.class);
          const ticketName = upperVi(ticket.name);
          const isTargetClass =
            targetClass !== "" &&
            (ticketName === targetClass || ticketName.includes(targetClass));

          if (voucherData.classy === "rate" && (!targetClass || isTargetClass)) {
            money = Math.round(money * (100 - (voucherData.rate ?? 0)) / 100);
          }

          if (voucherData.classy === "money") {
            if (targetClass) {
              if (isTargetClass) {
                money = Math.max(0, money - (voucherData.money ?? 0));
              }
            } else if (remainingCartDiscount > 0 && totalRemainingTickets > 0) {
              const deduct = Math.min(
                money,
                Math.ceil(remainingCartDiscount / totalRemainingTickets)
              );
              money -= deduct;
              remainingCartDiscount -= deduct;
            }
          }
        }

        if (totalRemainingTickets > 0) {
          totalRemainingTickets -= 1;
        }

        await connection.query(
          `
            INSERT INTO orders (
              ordercode, create_time, name, phone, email, gender, class, money, money_VAT,
              status, is_gift, is_checkin, number_checkin, career, hope, ref, source,
              send_noti, customer_id, voucher, utm_source, utm_medium, utm_campaign, order_id
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?,
              'new', 0, 0, 0, ?, ?, ?, ?,
              0, ?, ?, ?, ?, ?, ?
            )
          `,
          [
            orderCode,
            createTime,
            name,
            phone,
            email,
            gender,
            ticket.name,
            money,
            money,
            career,
            hope,
            ref,
            source,
            customerId,
            voucherCode || null,
            utmSource,
            utmMedium,
            utmCampaign,
            orderId
          ]
        );

        webhookTickets.push({
          ordercode: orderCode,
          ticket_name: ticket.name,
          price: money
        });
        inserted += 1;
      }
    }

    if (voucherCode) {
      await connection.query(
        "UPDATE voucher SET number = number - 1 WHERE voucher = ? AND number > 0",
        [voucherCode]
      );
    }

    await connection.commit();

    await sendRegisterWebhook({
      order_id: orderId,
      create_time: createTime,
      ref,
      name,
      phone,
      email,
      gender,
      career,
      hope,
      total_tickets: inserted,
      tickets: webhookTickets,
      source,
      customer_id: customerId,
      voucher: voucherCode || null,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      user_agent: userAgent,
      ip: clientIp,
      fbp,
      fbc
    });

    return {
      orderId,
      redirect: `${getBaseUrl()}/thanh-toan?orderid=${encodeURIComponent(orderId)}`
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getOrderDetail(orderId: string) {
  const code = orderId.trim();
  if (!code) return null;

  const pool = getDatabasePool();
  if (!pool) {
    const mockOrder = getMockOrder(code);
    return mockOrder ? buildOrderDetail(mockOrder) : null;
  }

  const [rows] = await pool.query<OrderRow[]>(
    `
      SELECT ordercode, order_id, create_time, name, phone, email, gender, class, money, status
      FROM orders
      WHERE order_id = ?
      ORDER BY id ASC
    `,
    [code]
  );

  if (rows.length === 0) {
    return null;
  }

  const records: OrderRecord[] = rows.map((row) => ({
    orderCode: row.ordercode,
    orderId: row.order_id,
    createTime: row.create_time,
    customerName: row.name,
    phone: row.phone,
    email: row.email,
    gender: row.gender,
    className: row.class,
    money: Number(row.money),
    status: row.status,
    transferContent: row.order_id
  }));

  return buildOrderDetail(records);
}

export async function checkPaymentStatus(
  orderId: string,
  manual = false
): Promise<PaymentStatus> {
  const code = orderId.trim();
  if (!code) {
    return { status: "pending" };
  }

  const pool = getDatabasePool();
  if (!pool) {
    if (manual) {
      markMockOrderPaid(code);
    }
    const order = getMockOrder(code);
    if (!order) return { status: "pending" };
    return {
      status: order.some((record) => isPaidStatus(record.status)) ? "paydone" : "pending"
    };
  }

  const checkPaymentUrl = process.env.BS_CHECK_PAYMENT_URL;
  if (checkPaymentUrl) {
    try {
      const response = await fetch(checkPaymentUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ orderid: code }),
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const payload = (await response.json()) as { status?: string };
        if (payload.status === "paydone") {
          return { status: "paydone" };
        }
      }
    } catch (error) {
      console.error("Payment status proxy failed", error);
    }
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT status FROM orders WHERE order_id = ? LIMIT 1",
    [code]
  );
  const status = String(rows[0]?.status || "");

  return {
    status: isPaidStatus(status) ? "paydone" : "pending"
  };
}

export async function markOrderPaid(orderId: string) {
  const code = orderId.trim();
  if (!code) {
    throw new Error("Order ID khong hop le.");
  }

  const pool = getDatabasePool();
  if (!pool) {
    const updated = markMockOrderPaid(code);
    if (!updated) {
      throw new Error("Khong tim thay don hang.");
    }
    return;
  }

  await pool.query("UPDATE orders SET status = 'paydone' WHERE order_id = ?", [code]);
}

export function buildRequestMeta(headers: Headers) {
  return {
    userAgent: headers.get("user-agent") || "",
    clientIp: createClientIp(headers)
  };
}

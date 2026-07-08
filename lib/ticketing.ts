import "server-only";

import { isIP } from "node:net";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getDatabasePool, hasDatabaseConfig } from "@/lib/db";
import {
  decreaseMockVoucher,
  getMockOrder,
  getMockTickets,
  getMockVoucher,
  hasMockOrderCode,
  markMockOrderPaid,
  saveMockOrder
} from "@/lib/mock-store";
import type {
  CartTicketInput,
  CreateOrderInput,
  CreatedOrder,
  CheckedTicket,
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
  order_id: string | null;
  create_time: string;
  name: string;
  phone: string;
  email: string;
  gender: string;
  class: string;
  money: number;
  status: string;
};

const EXTERNAL_WEBHOOK_TIMEOUT_MS = Number(
  process.env.BS_WEBHOOK_TIMEOUT_MS || 15000
);
let hasOrderIdColumnCache: boolean | null = null;

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function normalizeExternalUrl(value?: string) {
  return value?.trim().replace(/^"(.*)"$/, "$1") || "";
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

function normalizeIpCandidate(value: string) {
  let candidate = value.trim();
  if (!candidate || candidate.toLowerCase() === "unknown") return "";

  candidate = candidate.replace(/^for=/i, "").replace(/^"|"$/g, "");

  if (candidate.startsWith("::ffff:")) {
    candidate = candidate.slice(7);
  }

  if (candidate.startsWith("[") && candidate.includes("]")) {
    candidate = candidate.slice(1, candidate.indexOf("]"));
  } else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(candidate)) {
    candidate = candidate.replace(/:\d+$/, "");
  }

  return isIP(candidate) ? candidate : "";
}

function isPrivateOrLoopbackIp(ip: string) {
  if (ip === "::1" || ip === "0.0.0.0") return true;
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("169.254.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip)) return true;
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true;
  if (ip.startsWith("fe80:")) return true;
  return false;
}

function getForwardedHeaderIps(headerValue: string) {
  return headerValue
    .split(",")
    .flatMap((part) => part.split(";"))
    .map((part) => part.trim())
    .filter((part) => /^for=/i.test(part))
    .map(normalizeIpCandidate)
    .filter(Boolean);
}

function createClientIp(headers: Headers) {
  const directHeaders = [
    "cf-connecting-ip",
    "true-client-ip",
    "x-client-ip",
    "x-real-ip",
    "x-forwarded-for",
    "x-original-forwarded-for",
    "forwarded-for",
    "proxy-client-ip",
    "wl-proxy-client-ip",
    "x-cluster-client-ip",
    "x-vercel-forwarded-for",
    "fly-client-ip"
  ];

  const candidates: string[] = [];

  for (const headerName of directHeaders) {
    const headerValue = headers.get(headerName);
    if (!headerValue) continue;

    headerValue
      .split(",")
      .map(normalizeIpCandidate)
      .filter(Boolean)
      .forEach((candidate) => candidates.push(candidate));
  }

  const forwarded = headers.get("forwarded");
  if (forwarded) {
    getForwardedHeaderIps(forwarded).forEach((candidate) => candidates.push(candidate));
  }

  const firstPublicIp = candidates.find((candidate) => !isPrivateOrLoopbackIp(candidate));
  if (firstPublicIp) {
    return firstPublicIp;
  }

  const firstKnownIp = candidates.find(Boolean);
  return firstKnownIp || "0.0.0.0";
}

async function generateUniqueCode(
  prefix: "DH" | "OD",
  connection?: PoolConnection
) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const code = generateCode(prefix);

    if (!connection) {
      const exists = hasMockOrderCode(code);
      if (!exists) return code;
      continue;
    }

    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM orders WHERE ordercode = ? LIMIT 1",
      [code]
    );

    if (rows.length === 0) return code;
  }

  return generateCode(prefix);
}

async function hasOrdersOrderIdColumn(connection: Pick<PoolConnection, "query">) {
  if (hasOrderIdColumnCache !== null) {
    return hasOrderIdColumnCache;
  }

  const [rows] = await connection.query<RowDataPacket[]>(
    "SHOW COLUMNS FROM orders LIKE 'order_id'"
  );
  hasOrderIdColumnCache = rows.length > 0;
  return hasOrderIdColumnCache;
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
  const statuses = records.map((record) => record.status.trim().toLowerCase());
  const detailStatus = statuses.some((status) => isPaidStatus(status))
    ? "paydone"
    : statuses.includes("expired")
      ? "expired"
      : statuses.includes("new")
        ? "new"
        : first.status || "pending";

  return {
    orderId: first.orderId,
    customerName: first.customerName,
    phone: first.phone,
    email: first.email,
    transferContent: first.orderId,
    totalMoney: records.reduce((sum, record) => sum + record.money, 0),
    status: detailStatus,
    records
  };
}

async function sendRegisterWebhook(payload: Record<string, unknown>) {
  const webhookUrl = normalizeExternalUrl(process.env.BS_REGISTER_WEBHOOK_URL);
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
      signal: AbortSignal.timeout(EXTERNAL_WEBHOOK_TIMEOUT_MS)
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

async function saveCustomerTracking(
  connection: PoolConnection,
  payload: {
    career: string;
    clientIp: string;
    createTime: string;
    customerId: string;
    email: string;
    fbc: string;
    fbp: string;
    gender: string;
    name: string;
    phone: string;
    ttclid: string;
    ttp: string;
    userAgent: string;
  }
) {
  const [updateResult] = await connection.query<ResultSetHeader>(
    `
      UPDATE customer
      SET
        name = ?,
        gender = ?,
        phone = ?,
        email = ?,
        career = ?,
        user_ip = ?,
        user_agent = ?,
        fbp = ?,
        fbc = ?,
        create_time = ?,
        ttclid = COALESCE(NULLIF(?, ''), ttclid),
        ttp = COALESCE(NULLIF(?, ''), ttp),
        updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = ? OR phone = ?
    `,
    [
      payload.name,
      payload.gender,
      payload.phone,
      payload.email,
      payload.career,
      payload.clientIp,
      payload.userAgent,
      payload.fbp,
      payload.fbc,
      payload.createTime,
      payload.ttclid,
      payload.ttp,
      payload.customerId,
      payload.phone
    ]
  );

  if (updateResult.affectedRows > 0) return;

  await connection.query(
    `
      INSERT INTO customer (
        customer_id, name, gender, phone, email, career, user_ip, user_agent,
        fbp, fbc, create_time, ttclid, ttp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.customerId,
      payload.name,
      payload.gender,
      payload.phone,
      payload.email,
      payload.career,
      payload.clientIp,
      payload.userAgent,
      payload.fbp,
      payload.fbc,
      payload.createTime,
      payload.ttclid,
      payload.ttp
    ]
  );
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
  const brand = input.brand?.trim() || "";
  const hope = input.hope.trim();
  const voucherCode = input.voucherCode?.trim() || "";
  const source = input.source?.trim() || "";
  const ref = input.ref?.trim() || "";
  const utmSource = input.utmSource?.trim() || "";
  const utmMedium = input.utmMedium?.trim() || "";
  const utmCampaign = input.utmCampaign?.trim() || "";
  const fbp = input.fbp?.trim() || "";
  const fbc = input.fbc?.trim() || "";
  const ttp = input.ttp?.trim() || "";
  const ttclid = input.ttclid?.trim() || "";
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
    const redirectOrderId = await generateUniqueCode("OD");
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
          orderId: redirectOrderId,
          createTime,
          customerName: name,
          phone,
          email,
          gender,
          className: ticket.name,
          money,
          status: "new",
          transferContent: redirectOrderId
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

    saveMockOrder(redirectOrderId, mockRecords);
    await sendRegisterWebhook({
      order_id: redirectOrderId,
      create_time: createTime,
      ref,
      name,
      phone,
      email,
      gender,
      career,
      brand,
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
      fbc,
      ttp,
      ttclid
    });

    return {
      orderId: redirectOrderId,
      redirect: `${getBaseUrl()}/thanh-toan?ordercode=${encodeURIComponent(redirectOrderId)}`
    };
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const redirectOrderId = await generateUniqueCode("OD", connection);
    const supportsOrderId = await hasOrdersOrderIdColumn(connection);
    const webhookTickets: Array<{ ordercode: string; ticket_name: string; price: number }> = [];
    let inserted = 0;

    await saveCustomerTracking(connection, {
      career,
      clientIp,
      createTime,
      customerId,
      email,
      fbc,
      fbp,
      gender,
      name,
      phone,
      ttclid,
      ttp,
      userAgent
    });

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

        if (supportsOrderId) {
          await connection.query(
            `
              INSERT INTO orders (
                order_id, ordercode, create_time, name, phone, email, gender, class, money,
                status, is_gift, is_checkin, number_checkin, career, brand, ref, source,
                send_noti, customer_id, voucher, utm_source, utm_medium, utm_campaign
              ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?,
                'new', 0, 0, 0, ?, ?, ?, ?,
                0, ?, ?, ?, ?, ?
              )
            `,
            [
              redirectOrderId,
              orderCode,
              createTime,
              name,
              phone,
              email,
              gender,
              ticket.name,
              money,
              career,
              brand,
              ref,
              source,
              customerId,
              voucherCode || null,
              utmSource,
              utmMedium,
              utmCampaign
            ]
          );
        } else {
          await connection.query(
            `
              INSERT INTO orders (
                ordercode, create_time, name, phone, email, gender, class, money,
                status, is_gift, is_checkin, number_checkin, career, brand, ref, source,
                send_noti, customer_id, voucher, utm_source, utm_medium, utm_campaign
              ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?,
                'new', 0, 0, 0, ?, ?, ?, ?,
                0, ?, ?, ?, ?, ?
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
              career,
              brand,
              ref,
              source,
              customerId,
              voucherCode || null,
              utmSource,
              utmMedium,
              utmCampaign
            ]
          );
        }
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
      order_id: redirectOrderId,
      create_time: createTime,
      ref,
      name,
      phone,
      email,
      gender,
      career,
      brand,
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
      fbc,
      ttp,
      ttclid
    });

    return {
      orderId: redirectOrderId,
      redirect: `${getBaseUrl()}/thanh-toan?ordercode=${encodeURIComponent(redirectOrderId)}`
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}


export async function getPaidTicketByOrderCode(
  orderCode: string
): Promise<CheckedTicket | null> {
  const code = orderCode.trim();
  if (!code) return null;

  const pool = getDatabasePool();
  if (!pool) {
    const mockOrder = getMockOrder(code);
    if (!mockOrder?.some((record) => isPaidStatus(record.status))) return null;
    return { orderCode: code };
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT ordercode, status FROM orders WHERE ordercode = ? LIMIT 1",
    [code]
  );

  const row = rows[0];
  if (!row || !isPaidStatus(String(row.status || ""))) return null;

  return {
    orderCode: String(row.ordercode || code)
  };
}
export async function getOrderDetail(orderId: string) {
  const code = orderId.trim();
  if (!code) return null;

  const pool = getDatabasePool();
  if (!pool) {
    const mockOrder = getMockOrder(code);
    return mockOrder ? buildOrderDetail(mockOrder) : null;
  }

  const supportsOrderId = await hasOrdersOrderIdColumn(pool);
  const [rows] = supportsOrderId
    ? await pool.query<OrderRow[]>(
        `
          SELECT ordercode, order_id, create_time, name, phone, email, gender, class, money, status
          FROM orders
          WHERE order_id = ?
          ORDER BY id ASC
        `,
        [code]
      )
    : await pool.query<OrderRow[]>(
        `
          SELECT ordercode, NULL AS order_id, create_time, name, phone, email, gender, class, money, status
          FROM orders
          WHERE ordercode = ?
          ORDER BY id ASC
        `,
        [code]
      );

  if (rows.length === 0) {
    const [fallbackRows] = await pool.query<OrderRow[]>(
      `
        SELECT ordercode, ${supportsOrderId ? "order_id" : "NULL AS order_id"}, create_time, name, phone, email, gender, class, money, status
        FROM orders
        WHERE ordercode = ?
        ORDER BY id ASC
      `,
      [code]
    );

    if (fallbackRows.length === 0) {
      return null;
    }

    rows.push(...fallbackRows);
  }

  const records: OrderRecord[] = rows.map((row) => ({
    orderCode: row.ordercode,
    orderId: row.order_id || code,
    createTime: row.create_time,
    customerName: row.name,
    phone: row.phone,
    email: row.email,
    gender: row.gender,
    className: row.class,
    money: Number(row.money),
    status: row.status,
    transferContent: row.order_id || code
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

  const checkPaymentUrl = normalizeExternalUrl(process.env.BS_CHECK_PAYMENT_URL);
  if (checkPaymentUrl) {
    try {
      console.info("Checking payment status via external endpoint", {
        checkPaymentUrl,
        orderId: code
      });

      const response = await fetch(checkPaymentUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ orderid: code }),
        signal: AbortSignal.timeout(EXTERNAL_WEBHOOK_TIMEOUT_MS)
      });

      const responseText = await response.text();
      if (!response.ok) {
        console.error("Payment status proxy failed", {
          checkPaymentUrl,
          orderId: code,
          status: response.status,
          body: responseText
        });
      } else {
        try {
          const payload = JSON.parse(responseText) as { status?: string };
          if (payload.status === "paydone") {
            return { status: "paydone" };
          }
        } catch (error) {
          console.error("Payment status proxy invalid JSON response", {
            checkPaymentUrl,
            orderId: code,
            body: responseText,
            error
          });
        }
      }
    } catch (error) {
      console.error("Payment status proxy request error", {
        checkPaymentUrl,
        orderId: code,
        error
      });
    }
  }

  const supportsOrderId = await hasOrdersOrderIdColumn(pool);
  const [rows] = await pool.query<RowDataPacket[]>(
    supportsOrderId
      ? "SELECT status FROM orders WHERE order_id = ? OR ordercode = ?"
      : "SELECT status FROM orders WHERE ordercode = ?",
    supportsOrderId ? [code, code] : [code]
  );

  return {
    status: rows.some((row) => isPaidStatus(String(row.status || ""))) ? "paydone" : "pending"
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

  const supportsOrderId = await hasOrdersOrderIdColumn(pool);
  await pool.query(
    supportsOrderId
      ? "UPDATE orders SET status = 'paydone' WHERE order_id = ? OR ordercode = ?"
      : "UPDATE orders SET status = 'paydone' WHERE ordercode = ?",
    supportsOrderId ? [code, code] : [code]
  );
}

export function buildRequestMeta(headers: Headers) {
  return {
    userAgent: headers.get("user-agent") || "",
    clientIp: createClientIp(headers)
  };
}

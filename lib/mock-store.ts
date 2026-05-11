import { mockTickets, mockVouchers } from "@/lib/constants";
import type { OrderRecord, Ticket } from "@/lib/types";

type MutableVoucher = {
  voucher: string;
  classy: "money" | "rate";
  class: string;
  rate: number | null;
  money: number | null;
  number: number;
  fromDate: string;
  toDate: string;
};

const tickets: Ticket[] = [...mockTickets];
const vouchers = new Map<string, MutableVoucher>(
  mockVouchers.map((voucher) => [
    voucher.voucher.toUpperCase(),
    {
      ...voucher,
      number: voucher.number ?? 0
    }
  ])
);
const orders = new Map<string, OrderRecord[]>();

export function getMockTickets() {
  return tickets;
}

export function getMockVoucher(code: string) {
  return vouchers.get(code.trim().toUpperCase()) ?? null;
}

export function decreaseMockVoucher(code: string) {
  const voucher = vouchers.get(code.trim().toUpperCase());
  if (!voucher || voucher.number <= 0) return;
  voucher.number -= 1;
}

export function hasMockOrderCode(orderCode: string) {
  for (const records of orders.values()) {
    if (records.some((record) => record.orderCode === orderCode)) {
      return true;
    }
  }
  return false;
}

export function hasMockOrderId(orderId: string) {
  return orders.has(orderId);
}

export function saveMockOrder(orderId: string, records: OrderRecord[]) {
  orders.set(orderId, records);
}

export function getMockOrder(orderId: string) {
  return orders.get(orderId) ?? null;
}

export function markMockOrderPaid(orderId: string) {
  const records = orders.get(orderId);
  if (!records) return false;
  orders.set(
    orderId,
    records.map((record) => ({
      ...record,
      status: "paydone"
    }))
  );
  return true;
}

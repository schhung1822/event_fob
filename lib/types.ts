export type GenderValue = "m" | "f" | "other";

export type Ticket = {
  id: number;
  ticketId: string;
  img: string;
  name: string;
  money: number;
  moneySale: number | null;
};

export type CartTicketInput = {
  ticketId: string;
  name: string;
  quantity: number;
  price: number;
};

export type VoucherClassy = "money" | "rate";

export type ValidatedVoucher = {
  classy: VoucherClassy;
  money: number | null;
  rate: number | null;
  class: string;
  voucher: string;
};

export type PurchaseForm = {
  name: string;
  phone: string;
  email: string;
  gender: GenderValue | "";
  career: string;
  hope: string;
};

export type CreateOrderInput = PurchaseForm & {
  voucherCode?: string;
  tickets: CartTicketInput[];
  source?: string;
  ref?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  fbp?: string;
  fbc?: string;
  userAgent?: string;
  clientIp?: string;
};

export type CreatedOrder = {
  orderId: string;
  redirect: string;
};

export type OrderRecord = {
  orderCode: string;
  orderId: string;
  createTime: string;
  customerName: string;
  phone: string;
  email: string;
  gender: string;
  className: string;
  money: number;
  status: string;
  transferContent: string;
};

export type OrderDetail = {
  orderId: string;
  customerName: string;
  phone: string;
  email: string;
  transferContent: string;
  totalMoney: number;
  status: string;
  records: OrderRecord[];
};

export type PaymentStatus = {
  status: "pending" | "paydone";
};

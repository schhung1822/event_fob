export const careerOptions = [
  "Bác sĩ",
  "Chủ Spa/ TMV/ Phòng Khám",
  "Content Creator/ KOL/ KOC",
  "Khách hàng quan tâm đến làm đẹp và yêu thích mỹ phẩm",
  "Khách hàng là fan của DSTH Kim Bum"
];

export const hopeOptions = [
  "Cập nhật kiến thức, chuyên môn - nhận chứng chỉ",
  "Tìm hiểu chính sách chiết khấu của các nhãn hàng",
  "Nhận quà tặng - sản phẩm trải nghiệm từ các thương hiệu",
  "Xây dựng thương hiệu cá nhân, hình ảnh, giao lưu, kết nối",
  "Giao lưu văn hóa - giải trí nghệ thuật",
  "Tất cả các ý trên"
];

import type { Ticket, ValidatedVoucher } from "@/lib/types";

export const mockTickets: Ticket[] = [
  {
    id: 1,
    ticketId: "GOLD",
    img: "",
    name: "Vé GOLD",
    money: 3000000,
    moneySale: 2500000
  },
  {
    id: 2,
    ticketId: "RUBY",
    img: "",
    name: "Vé RUBY",
    money: 2000000,
    moneySale: 1700000
  },
  {
    id: 3,
    ticketId: "VIP",
    img: "",
    name: "Vé VIP",
    money: 5000000,
    moneySale: 4500000
  }
];

export const mockVouchers: Array<
  ValidatedVoucher & {
    number: number;
    fromDate: string;
    toDate: string;
  }
> = [
  {
    voucher: "WELCOME10",
    classy: "rate",
    class: "",
    rate: 10,
    money: null,
    number: 999,
    fromDate: "",
    toDate: ""
  },
  {
    voucher: "GOLD500",
    classy: "money",
    class: "GOLD",
    rate: null,
    money: 500000,
    number: 50,
    fromDate: "",
    toDate: ""
  }
];

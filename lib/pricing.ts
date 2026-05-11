import type { CartTicketInput, ValidatedVoucher } from "@/lib/types";
import { upperVi } from "@/lib/utils";

export function calculateCartSummary(
  tickets: CartTicketInput[],
  voucher: ValidatedVoucher | null
) {
  const subtotal = tickets.reduce(
    (sum, ticket) => sum + ticket.price * ticket.quantity,
    0
  );

  let discount = 0;

  if (voucher && subtotal > 0) {
    if (voucher.classy === "money") {
      if (voucher.class) {
        tickets.forEach((ticket) => {
          if (upperVi(ticket.name).includes(upperVi(voucher.class))) {
            discount += Math.min(ticket.price, voucher.money ?? 0) * ticket.quantity;
          }
        });
      } else {
        discount = voucher.money ?? 0;
      }
    }

    if (voucher.classy === "rate") {
      if (voucher.class) {
        tickets.forEach((ticket) => {
          if (upperVi(ticket.name).includes(upperVi(voucher.class))) {
            discount += Math.round(
              (ticket.price * ticket.quantity * (voucher.rate ?? 0)) / 100
            );
          }
        });
      } else {
        discount = Math.round((subtotal * (voucher.rate ?? 0)) / 100);
      }
    }
  }

  discount = Math.min(discount, subtotal);

  return {
    subtotal,
    discount,
    total: subtotal - discount
  };
}

import { PaymentPage } from "@/components/payment-page";
import { getBankConfig } from "@/lib/ticketing";

export const dynamic = "force-dynamic";

export default function ThanhToanPage({
  searchParams
}: {
  searchParams: { ordercode?: string; orderid?: string };
}) {
  const bankConfig = getBankConfig();
  const orderCode = (searchParams.ordercode || searchParams.orderid || "").trim();

  return (
    <PaymentPage
      orderId={orderCode}
      bankAccount={bankConfig.bankAccount}
      bankName={bankConfig.bankName}
      bankOwner={bankConfig.bankOwner}
      qrBase={bankConfig.qrBase}
    />
  );
}

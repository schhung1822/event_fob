import { PaymentPage } from "@/components/payment-page";
import { getBankConfig } from "@/lib/ticketing";

export const dynamic = "force-dynamic";

export default function ThanhToanPage({
  searchParams
}: {
  searchParams: { orderid?: string };
}) {
  const bankConfig = getBankConfig();

  return (
    <PaymentPage
      orderId={searchParams.orderid ?? ""}
      bankAccount={bankConfig.bankAccount}
      bankName={bankConfig.bankName}
      bankOwner={bankConfig.bankOwner}
      qrBase={bankConfig.qrBase}
    />
  );
}

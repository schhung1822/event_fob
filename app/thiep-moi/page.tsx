import { InvitationCardPage } from "@/components/invitation-card-page";

export const dynamic = "force-dynamic";

export default function ThiepMoiPage({
  searchParams
}: {
  searchParams: { orderId?: string; orderid?: string; ordercode?: string };
}) {
  const orderId = (searchParams.orderId || searchParams.orderid || searchParams.ordercode || "").trim();

  return <InvitationCardPage orderId={orderId} />;
}
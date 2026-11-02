import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default function StoreCartPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-center">Opening cart...</div>}>
      <StoreCartRedirect params={params} />
    </Suspense>
  );
}

async function StoreCartRedirect({ params }: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  return redirect(`/cart?storeId=${encodeURIComponent(storeId)}`);
}

'use client';

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading order status...</div>}>
      <SuccessPageContent />
    </Suspense>
  );
}

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const type = searchParams.get("type");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <h1 className="text-3xl font-bold text-green-600 mb-2">Order Successful!</h1>
      {type === "cash" ? (
        <p className="text-gray-600 mb-4">
          Your Cash on Delivery order has been placed successfully. Please keep exact cash ready upon delivery!
        </p>
      ) : (
        <p className="text-gray-600 mb-4">
          Thank you for your payment. Your order has been processed successfully via Stripe.
        </p>
      )}
      {orderId && (
        <p className="text-sm text-gray-400 font-mono">Order Reference ID: {orderId}</p>
      )}
    </div>
  );
}
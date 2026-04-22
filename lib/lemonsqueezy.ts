// File name kept for compatibility with the original architecture plan.
// Billing is handled through Stripe Payment Links in this build.

export function getStripePaymentLink() {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "";
}

export function requireStripePaymentLink() {
  const link = getStripePaymentLink();
  if (!link) {
    throw new Error("NEXT_PUBLIC_STRIPE_PAYMENT_LINK is not configured.");
  }
  return link;
}

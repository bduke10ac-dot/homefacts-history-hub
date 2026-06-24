const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

/**
 * Purely informational banner about Stripe environment.
 * Does NOT block any user flow — sign-up, sign-in, free reports,
 * report viewing, and admin/builder pages all work whether or not
 * payments are configured.
 */
export function PaymentTestModeBanner() {
  // No Stripe configured at all → hide entirely. The previous red banner
  // was alarming for non-payment flows. The Pricing page already shows an
  // inline notice when checkout isn't wired.
  if (!clientToken) return null;

  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-sm text-orange-800">
        Payments are in test mode. Use card 4242 4242 4242 4242, any future expiry, any CVC.
      </div>
    );
  }
  return null;
}


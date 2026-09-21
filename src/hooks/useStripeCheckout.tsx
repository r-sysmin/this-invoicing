import { useState, useCallback } from "react";
import { X } from "lucide-react";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { Button } from "@/components/ui/button";

interface CheckoutOptions {
  priceId: string;
  quantity?: number;
  userId?: string;
  returnUrl?: string;
}

export function useStripeCheckout() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<CheckoutOptions | null>(null);

  const openCheckout = useCallback((opts: CheckoutOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  const checkoutElement = isOpen && options ? (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4">
      <div className="relative my-8 w-full max-w-2xl rounded-[24px] border border-border bg-card shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 z-10"
          aria-label="Close checkout"
          onClick={closeCheckout}
        >
          <X className="h-4 w-4" />
        </Button>
        <StripeEmbeddedCheckout {...options} />
      </div>
    </div>
  ) : null;

  return { openCheckout, closeCheckout, isOpen, checkoutElement };
}

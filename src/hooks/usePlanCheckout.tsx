import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { storePostAuthRedirect } from "@/lib/post-auth-redirect";
import { getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

const PRICE_BY_PLAN: Record<string, string> = {
  Professional: "professional_monthly",
  Business: "business_monthly",
};

export function usePlanCheckout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();

  const selectPlan = useCallback(async (planName: string) => {
    if (!user) {
      // Ask them to sign in first, then bring them back to the pricing page.
      storePostAuthRedirect("/pricing");
      navigate("/signup");
      return;
    }

    const priceId = PRICE_BY_PLAN[planName];
    if (!priceId) {
      // Free plan — just head to the app.
      navigate("/dashboard");
      return;
    }

    // Don't let users subscribe to a plan they already have.
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id, status, current_period_end")
      .eq("user_id", user.id)
      .eq("price_id", priceId)
      .eq("environment", getStripeEnvironment())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && (existing.status === "active" || existing.status === "trialing")) {
      navigate("/dashboard?plan=active");
      return;
    }

    openCheckout({
      priceId,
      userId: user.id,
      returnUrl: `${window.location.origin}/dashboard?checkout=success`,
    });
  }, [user, navigate, openCheckout]);

  return { selectPlan, closeCheckout, isOpen, checkoutElement };
}

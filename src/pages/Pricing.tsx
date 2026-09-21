import { lazy, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import PricingHeader from '@/components/PricingHeader';
import { PaymentTestModeBanner } from '@/components/PaymentTestModeBanner';

// Lazy load below-the-fold sections
const PricingComparison = lazy(() => import('@/components/PricingComparison'));
const FAQ = lazy(() => import('@/components/FAQ'));
const Footer = lazy(() => import('@/components/Footer'));

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <Navbar />
      <PricingHeader />
      <Suspense fallback={<div className="h-48" />}>
        <PricingComparison />
        <FAQ />
        <Footer />
      </Suspense>
    </div>
  );
};

export default Pricing;

import React, { useState } from 'react';
import { Loader2, CreditCard, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RazorpayPaymentProps {
  amount: number;
  planId: string;
  planName: string;
  workerId: string;
  onSuccess: (paymentData: any) => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayPayment: React.FC<RazorpayPaymentProps> = ({
  amount,
  planId,
  planName,
  workerId,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create order on backend
      const token = localStorage.getItem('token');
      const orderResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            planId,
            planName,
            workerId,
          },
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderResponse.json();

      // Razorpay options
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'PayMigo',
        description: `${planName} Weekly Premium`,
        order_id: orderData.order_id,
        handler: async (response: any) => {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                workerId,
                planId,
                weeklyPremium: amount,
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            const verifyData = await verifyResponse.json();
            onSuccess(verifyData);
          } catch (err: any) {
            setError(err.message || 'Payment verification failed');
            if (onError) onError(err);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      if (onError) onError(err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handlePayment}
        disabled={loading}
        className={cn(
          'w-full py-6 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 group',
          loading
            ? 'bg-white/5 border border-white/10 cursor-not-allowed'
            : 'bg-accent text-white hover:scale-105 shadow-lg shadow-accent/20'
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-6 h-6 group-hover:scale-110 transition-transform" />
            Pay ₹{amount} with Razorpay
          </>
        )}
      </button>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-xl">
        <CheckCircle2 className="text-success w-5 h-5 shrink-0" />
        <p className="text-xs text-success/80">
          Secure payment powered by Razorpay. Test mode active.
        </p>
      </div>
    </div>
  );
};

export default RazorpayPayment;

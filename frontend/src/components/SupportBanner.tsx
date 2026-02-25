import { useState, useCallback, useEffect } from "react";
import { HeartIcon, CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import api from "../api/client";

const STRIPE_PK = "pk_test_51T4mFbENkNKqnOFp4zZblwLQ8JsOsdzFX8ssPuymS9nslOp31KNk8z8x9FGGXKXQKIoaNsVNUsFWJhDD7k0yipQ600dFlzMT6e";
const stripePromise = loadStripe(STRIPE_PK);

const SUGGESTED_AMOUNTS = [2, 5, 10, 20];

export default function SupportBanner() {
  const [amount, setAmount] = useState<number | "">(2);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [thanked, setThanked] = useState(false);

  // Check if returning from successful checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      setThanked(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const fetchClientSecret = useCallback(async () => {
    const { data } = await api.post("/billing/checkout", {
      amount: Math.round(checkoutAmount * 100),
    });
    return data.client_secret;
  }, [checkoutAmount]);

  const handleSupport = () => {
    if (!amount || amount < 1) return;
    setCheckoutAmount(amount as number);
    setShowCheckout(true);
  };

  const handleComplete = () => {
    setShowCheckout(false);
    setThanked(true);
  };

  if (thanked) {
    return (
      <div className="mt-8 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4">
        <CheckCircleIcon className="w-6 h-6 text-emerald-400 shrink-0" />
        <div>
          <p className="text-emerald-400 font-medium">Merci pour votre soutien !</p>
          <p className="text-gray-400 text-sm mt-0.5">
            Votre contribution aide directement à améliorer le service.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <HeartIcon className="w-5 h-5 text-rose-400" />
          <h3 className="text-base font-semibold text-white">Soutenir le projet</h3>
        </div>
        <p className="text-gray-400 text-sm mb-5">
          HomeAccess est gratuit. Les contributions volontaires servent uniquement
          à l'acquisition de matériel informatique pour améliorer le service.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {SUGGESTED_AMOUNTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setAmount(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                amount === s
                  ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300 border"
                  : "bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:text-gray-200 hover:border-gray-600"
              }`}
            >
              {s} €
            </button>
          ))}

          <div className="relative">
            <input
              type="number"
              min={1}
              max={1000}
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
              placeholder="Autre"
              className="w-24 px-3 py-2 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
          </div>

          <button
            onClick={handleSupport}
            disabled={!amount || amount < 1}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Soutenir
          </button>
        </div>
      </div>

      {/* Checkout modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCheckout(false)}
          />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl mx-4">
            <button
              onClick={() => setShowCheckout(false)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <div className="p-1">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ fetchClientSecret, onComplete: handleComplete }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

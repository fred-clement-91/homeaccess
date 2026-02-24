import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    if (newCode.every((d) => d !== "")) {
      submitCode(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      submitCode(pasted);
    }
  };

  const submitCode = async (fullCode: string) => {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify", {
        email,
        code: fullCode,
      });
      localStorage.setItem("token", data.access_token);
      await refreshUser();
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response
              ?.data?.detail
          : undefined;
      setError(msg || "Code invalide");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResent(false);
    try {
      await api.post("/auth/resend-code", { email });
      setResent(true);
    } catch {
      setError("Impossible de renvoyer le code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <GlobeAltIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Vérification
          </h1>
          <p className="text-gray-400 mt-2">
            Un code à 6 chiffres a été envoyé à
          </p>
          <p className="text-indigo-400 font-medium">{email}</p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-8 backdrop-blur">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {resent && (
            <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
              Nouveau code envoyé !
            </div>
          )}

          <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-gray-800/50 border border-gray-700/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition"
              />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}

          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Vous n'avez pas reçu le code ?{" "}
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {resending ? "Envoi..." : "Renvoyer"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

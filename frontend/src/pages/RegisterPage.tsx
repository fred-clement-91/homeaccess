import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { GlobeAltIcon } from "@heroicons/react/24/outline";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", { email });
      navigate(`/verify?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response
              ?.data?.detail
          : undefined;
      setError(msg || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
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
            HomeAccess
          </h1>
          <p className="text-gray-400 mt-2">
            Créez votre compte pour commencer
          </p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-8 backdrop-blur">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition"
                placeholder="vous@exemple.com"
              />
            </div>

            <p className="text-gray-500 text-sm">
              Un mot de passe sera généré et envoyé à votre adresse email.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Inscription..." : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Déjà un compte ?{" "}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

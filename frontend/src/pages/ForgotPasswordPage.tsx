import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { GlobeAltIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
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
            Réinitialisation du mot de passe
          </p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-8 backdrop-blur">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Email envoyé !
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Si un compte existe pour <strong className="text-gray-300">{email}</strong>, un nouveau mot de passe a été envoyé.
              </p>
              <Link
                to="/login"
                className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all duration-200"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <p className="text-gray-400 text-sm mb-6">
                Entrez votre adresse email. Un nouveau mot de passe vous sera envoyé.
              </p>

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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? "Envoi en cours..." : "Réinitialiser le mot de passe"}
                </button>
              </form>

              <p className="text-center text-gray-400 text-sm mt-6">
                <Link
                  to="/login"
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

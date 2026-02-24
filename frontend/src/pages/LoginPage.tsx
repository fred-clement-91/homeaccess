import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  GlobeAltIcon,
  VideoCameraIcon,
  HomeModernIcon,
  CircleStackIcon,
  ComputerDesktopIcon,
  ServerStackIcon,
  WifiIcon,
  ShieldCheckIcon,
  SignalIcon,
} from "@heroicons/react/24/outline";

const devices = [
  {
    icon: HomeModernIcon,
    label: "Home Assistant",
    color: "from-emerald-400 to-teal-500",
    pos: "top-8 left-8",
    delay: "0s",
  },
  {
    icon: VideoCameraIcon,
    label: "Cameras IP",
    color: "from-blue-400 to-cyan-500",
    pos: "top-6 right-12",
    delay: "0.5s",
  },
  {
    icon: CircleStackIcon,
    label: "NAS",
    color: "from-orange-400 to-amber-500",
    pos: "top-1/3 left-4",
    delay: "1s",
  },
  {
    icon: ComputerDesktopIcon,
    label: "Jellyfin",
    color: "from-purple-400 to-pink-500",
    pos: "top-1/3 right-6",
    delay: "1.5s",
  },
  {
    icon: ServerStackIcon,
    label: "Nextcloud",
    color: "from-red-400 to-rose-500",
    pos: "bottom-1/3 left-10",
    delay: "2s",
  },
  {
    icon: WifiIcon,
    label: "Zigbee/MQTT",
    color: "from-indigo-400 to-violet-500",
    pos: "bottom-1/3 right-4",
    delay: "2.5s",
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response
              ?.data?.detail
          : undefined;
      if (msg === "not_verified") {
        navigate(`/verify?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(msg || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Left panel — visual / marketing */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/8 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg px-12">
          {/* Device grid */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {devices.map((device) => (
              <div
                key={device.label}
                className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-900/60 border border-gray-800/50 hover:border-gray-700/80 transition-all duration-500 hover:scale-105"
                style={{ animationDelay: device.delay }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${device.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <device.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-gray-400 font-medium text-center">
                  {device.label}
                </span>
              </div>
            ))}
          </div>

          {/* Accroche */}
          <div className="space-y-5">
            <h2 className="text-2xl font-bold leading-snug text-white">
              Passionné de{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                domotique
              </span>
              , pas d'IP fixe ?
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Vous souhaitez accéder à vos appareils depuis l'extérieur sans
              passer par un cloud que vous ne maîtrisez pas ?{" "}
              <span className="text-indigo-400 font-semibold">HomeAccess</span>{" "}
              est fait pour vous.
            </p>

            {/* Trust badges */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                <span>Chiffrement WireGuard</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <SignalIcon className="w-4 h-4 text-indigo-400" />
                <span>Pas besoin d'IP fixe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <GlobeAltIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              HomeAccess
            </h1>
            <p className="text-gray-400 mt-2">
              Connectez-vous pour accéder à votre espace
            </p>
          </div>

          {/* Message accroche mobile only */}
          <div className="lg:hidden mb-8 p-4 rounded-2xl bg-gray-900/50 border border-gray-800/50">
            <p className="text-gray-400 text-sm leading-relaxed text-center">
              Passionné de domotique, pas d'IP fixe ? Accédez à vos appareils
              sans cloud tiers.{" "}
              <span className="text-indigo-400 font-semibold">
                HomeAccess
              </span>{" "}
              est fait pour vous.
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

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Mot de passe
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition"
                  placeholder="Mot de passe reçu par email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <p className="text-center text-gray-400 text-sm mt-6">
              Pas encore de compte ?{" "}
              <Link
                to="/register"
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

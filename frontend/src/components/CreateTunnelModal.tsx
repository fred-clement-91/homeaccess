import { useState, useEffect, useRef } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import api from "../api/client";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const PORT_PRESETS = [
  { label: "Home Assistant", port: 8123, service: "homeassistant" },
  { label: "Jellyfin", port: 8096, service: "jellyfin" },
  { label: "Nextcloud", port: 443, service: "nextcloud" },
  { label: "Plex", port: 32400, service: "plex" },
  { label: "HTTP", port: 80, service: "http" },
  { label: "Perso.", port: 0, service: "custom" },
];

export default function CreateTunnelModal({ open, onClose, onCreated }: Props) {
  const [subdomain, setSubdomain] = useState("");
  const [targetPort, setTargetPort] = useState(8123);
  const [customPort, setCustomPort] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!subdomain || subdomain.length < 2) {
      setAvailable(null);
      return;
    }
    setChecking(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(
          `/tunnels/check-subdomain?subdomain=${subdomain.toLowerCase()}`
        );
        setAvailable(data.available);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 400);
  }, [subdomain]);

  const handlePreset = (index: number) => {
    setSelectedPreset(index);
    const preset = PORT_PRESETS[index];
    if (preset.port > 0) {
      setTargetPort(preset.port);
    }
  };

  const effectivePort =
    PORT_PRESETS[selectedPreset].port === 0
      ? parseInt(customPort) || 0
      : targetPort;

  const canSubmit =
    subdomain.length >= 2 &&
    available === true &&
    effectivePort > 0 &&
    effectivePort <= 65535 &&
    !creating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setCreating(true);
    try {
      await api.post("/tunnels/", {
        subdomain: subdomain.toLowerCase(),
        target_port: effectivePort,
        service_type: PORT_PRESETS[selectedPreset].service,
      });
      setSubdomain("");
      setTargetPort(8123);
      setSelectedPreset(0);
      setCustomPort("");
      onCreated();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response
              ?.data?.detail
          : undefined;
      setError(msg || "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg bg-gray-900 border border-gray-800/50 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
            <DialogTitle className="text-lg font-semibold text-white">
              Nouveau tunnel
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Subdomain */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sous-domaine
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) =>
                      setSubdomain(
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                      )
                    }
                    maxLength={63}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition pr-10"
                    placeholder="monserveur"
                  />
                  {subdomain.length >= 2 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checking ? (
                        <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-600 border-t-indigo-500" />
                      ) : available === true ? (
                        <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                      ) : available === false ? (
                        <XCircleIcon className="w-5 h-5 text-red-400" />
                      ) : null}
                    </div>
                  )}
                </div>
                <span className="text-gray-500 text-sm whitespace-nowrap">
                  .homeaccess.site
                </span>
              </div>
              {subdomain.length >= 2 && available === false && (
                <p className="text-red-400 text-xs mt-1.5">
                  Ce sous-domaine est déjà pris
                </p>
              )}
              {subdomain.length >= 2 && available === true && (
                <p className="text-emerald-400 text-xs mt-1.5">
                  Disponible !
                </p>
              )}
            </div>

            {/* Port */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Service / Port cible
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PORT_PRESETS.map((preset, i) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePreset(i)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      selectedPreset === i
                        ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300 border"
                        : "bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:text-gray-200 hover:border-gray-600"
                    }`}
                  >
                    <div>{preset.label}</div>
                    {preset.port > 0 && (
                      <div className="text-xs opacity-60 mt-0.5">
                        :{preset.port}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {PORT_PRESETS[selectedPreset].port === 0 && (
                <input
                  type="number"
                  min={1}
                  max={65535}
                  value={customPort}
                  onChange={(e) => setCustomPort(e.target.value)}
                  className="mt-3 w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition"
                  placeholder="Port personnalisé (1-65535)"
                />
              )}
            </div>

            {/* Preview */}
            {subdomain && effectivePort > 0 && (
              <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
                <p className="text-xs text-gray-500 mb-1">Votre URL :</p>
                <p className="text-sm font-mono text-indigo-400">
                  https://{subdomain.toLowerCase()}.homeaccess.site
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Redirige vers le port{" "}
                  <span className="text-gray-300">{effectivePort}</span> de
                  votre serveur
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {creating ? "Création en cours..." : "Créer le tunnel"}
            </button>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

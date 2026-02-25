import { useState, useEffect } from "react";
import {
  ArrowDownTrayIcon,
  TrashIcon,
  ServerIcon,
  LinkIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import api from "../api/client";
import type { Tunnel } from "../types";
import QRCodeModal from "./QRCodeModal";
import ServiceLogo from "./ServiceLogo";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
}

interface Props {
  tunnel: Tunnel;
  connected: boolean;
  connectedSince: number;
  onDelete: () => void;
  onToggle: (id: string, data: Record<string, unknown>) => void;
}

export default function TunnelCard({ tunnel, connected, connectedSince, onDelete, onToggle }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [configText, setConfigText] = useState("");
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  // Update "now" every second when connected to keep duration live
  useEffect(() => {
    if (!connected) return;
    setNow(Math.floor(Date.now() / 1000));
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1_000);
    return () => clearInterval(timer);
  }, [connected]);

  const uptimeLabel = connected && connectedSince > 0
    ? formatDuration(now - connectedSince)
    : null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/tunnels/${tunnel.id}`);
      onDelete();
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleDownload = async () => {
    const { data } = await api.get(`/tunnels/${tunnel.id}/config`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `homevpn-${tunnel.subdomain}.conf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleShowQR = async () => {
    try {
      const { data } = await api.get(`/tunnels/${tunnel.id}/config`);
      setConfigText(data);
      setShowQR(true);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative group bg-gray-900/50 border border-gray-800/50 rounded-2xl p-5 hover:border-gray-700/50 transition-all duration-200">
      {/* Status indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              tunnel.is_active
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                : "bg-gray-600"
            }`}
          />
          <span
            className={`text-xs font-medium ${
              tunnel.is_active ? "text-emerald-400" : "text-gray-500"
            }`}
          >
            {tunnel.is_active ? "Actif" : "Inactif"}
          </span>
        </div>
        <button
          onClick={() => onToggle(tunnel.id, { is_active: !tunnel.is_active })}
          className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer ${
            tunnel.is_active ? "bg-indigo-600" : "bg-gray-700"
          }`}
        >
          <div
            className={`absolute top-0.75 w-4 h-4 rounded-full bg-white transition-transform ${
              tunnel.is_active ? "translate-x-5" : "translate-x-0.75"
            }`}
          />
        </button>
      </div>

      {/* Domain */}
      <div className="flex items-start gap-3 mb-3">
        <ServiceLogo serviceType={tunnel.service_type} />
        <div className="min-w-0 flex-1">
          <a
            href={`https://${tunnel.full_domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link block"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-white truncate text-lg group-hover/link:text-indigo-400 transition-colors">
              {tunnel.subdomain}
            </h3>
            <p className="text-sm text-gray-500 truncate group-hover/link:text-indigo-400/70 transition-colors">
              {tunnel.full_domain}
            </p>
          </a>
          {tunnel.is_active && (
            <div
              className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                connected
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-gray-800/50 text-gray-500 border border-gray-700/50"
              }`}
            >
              <LinkIcon className="w-3 h-3" />
              {connected ? <>Connecté{uptimeLabel && <> · {uptimeLabel}</>}</> : "Déconnecté"}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
        <ServerIcon className="w-3.5 h-3.5" />
        <span>Port {tunnel.target_port}</span>
        <span className="text-gray-700">|</span>
        <span>VPN {tunnel.vpn_ip}</span>
        <span className="text-gray-700">|</span>
        <span>Device {tunnel.device_ip}</span>
      </div>

      {/* Target IP toggle */}
      <div className="flex items-center gap-2 text-xs mb-5">
        <span className="text-gray-500">Cible :</span>
        <div className="flex rounded-lg overflow-hidden border border-gray-700/50">
          <button
            onClick={() => { if (!tunnel.use_device_ip) onToggle(tunnel.id, { use_device_ip: true }); }}
            className={`px-2.5 py-1 font-medium transition-all cursor-pointer ${
              tunnel.use_device_ip
                ? "bg-blue-500/20 text-blue-400"
                : "bg-gray-800/50 text-gray-500 hover:text-gray-300"
            }`}
            title="Trafic vers l'équipement derrière le routeur WireGuard"
          >
            Équipement
          </button>
          <button
            onClick={() => { if (tunnel.use_device_ip) onToggle(tunnel.id, { use_device_ip: false }); }}
            className={`px-2.5 py-1 font-medium transition-all cursor-pointer ${
              !tunnel.use_device_ip
                ? "bg-purple-500/20 text-purple-400"
                : "bg-gray-800/50 text-gray-500 hover:text-gray-300"
            }`}
            title="Trafic directement vers le pair VPN"
          >
            VPN direct
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/10 text-sm font-medium transition-all cursor-pointer"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Config WG
        </button>
        <button
          onClick={handleShowQR}
          className="px-3 py-2 rounded-xl bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all cursor-pointer"
          title="QR Code WireGuard"
        >
          <QrCodeIcon className="w-4 h-4" />
        </button>
        {showConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
            >
              {deleting ? "..." : "Oui"}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-2 rounded-xl bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-all cursor-pointer"
            >
              Non
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-3 py-2 rounded-xl bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      <QRCodeModal
        open={showQR}
        onClose={() => setShowQR(false)}
        subdomain={tunnel.subdomain}
        configText={configText}
      />
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  ArrowDownTrayIcon,
  TrashIcon,
  GlobeAltIcon,
  ServerIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import api from "../api/client";
import type { Tunnel } from "../types";

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
  onToggle: (id: string, isActive: boolean) => void;
}

export default function TunnelCard({ tunnel, connected, connectedSince, onDelete, onToggle }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
          onClick={() => onToggle(tunnel.id, !tunnel.is_active)}
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
          <GlobeAltIcon className="w-5 h-5 text-indigo-400" />
        </div>
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
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
        <ServerIcon className="w-3.5 h-3.5" />
        <span>Port {tunnel.target_port}</span>
        <span className="text-gray-700">|</span>
        <span>{tunnel.vpn_ip}</span>
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
    </div>
  );
}

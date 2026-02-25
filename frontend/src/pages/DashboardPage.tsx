import { useEffect, useState, useCallback } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import TunnelCard from "../components/TunnelCard";
import CreateTunnelModal from "../components/CreateTunnelModal";
import type { Tunnel } from "../types";

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [peerStatus, setPeerStatus] = useState<Record<string, { connected: boolean; connected_since: number }>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchTunnels = async () => {
    try {
      const { data } = await api.get("/tunnels/");
      setTunnels(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get("/tunnels/status");
      setPeerStatus(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchTunnels();
    fetchStatus();
  }, [fetchStatus]);

  // Poll peer status every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchStatus, 5_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleCreated = () => {
    setShowCreate(false);
    fetchTunnels();
    fetchStatus();
    refreshUser();
  };

  const handleDeleted = () => {
    fetchTunnels();
    fetchStatus();
    refreshUser();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await api.patch(`/tunnels/${id}`, { is_active: isActive });
    fetchTunnels();
    fetchStatus();
  };

  const canCreate = user ? (user.tunnel_count ?? 0) < user.max_tunnels : false;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Mes tunnels</h1>
            {user?.is_beta_tester && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Compte gratuit bêta-testeur
              </span>
            )}
          </div>
          <p className="text-gray-400 mt-1">
            {user?.tunnel_count ?? 0} / {user?.max_tunnels ?? 0} tunnels
            utilisés
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={!canCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <PlusIcon className="w-5 h-5" />
          Nouveau tunnel
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : tunnels.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
            <PlusIcon className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-300">
            Aucun tunnel pour l'instant
          </h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            Créez votre premier tunnel pour accéder à votre serveur domestique
            depuis n'importe où.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all cursor-pointer"
          >
            Créer mon premier tunnel
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tunnels.map((tunnel) => (
            <TunnelCard
              key={tunnel.id}
              tunnel={tunnel}
              connected={peerStatus[tunnel.id]?.connected ?? false}
              connectedSince={peerStatus[tunnel.id]?.connected_since ?? 0}
              onDelete={handleDeleted}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      <CreateTunnelModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

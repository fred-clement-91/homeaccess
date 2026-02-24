import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import {
  UsersIcon,
  GlobeAltIcon,
  ShieldExclamationIcon,
  TrashIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import type { AdminUser, AdminTunnel } from "../types";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"users" | "tunnels">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tunnels, setTunnels] = useState<AdminTunnel[]>([]);
  const [peerStatus, setPeerStatus] = useState<
    Record<string, { connected: boolean; connected_since: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Redirect non-admin users
  if (!user?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch {
      /* ignore */
    }
  };

  const fetchTunnels = async () => {
    try {
      const { data } = await api.get("/admin/tunnels");
      setTunnels(data);
    } catch {
      /* ignore */
    }
  };

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/tunnels/status");
      setPeerStatus(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchUsers(), fetchTunnels(), fetchStatus()]).finally(() =>
      setLoading(false)
    );
  }, []);

  // Poll peer status every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchStatus, 5_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // --- User actions ---

  const handleToggleBan = async (u: AdminUser) => {
    await api.patch(`/admin/users/${u.id}`, { is_active: !u.is_active });
    fetchUsers();
  };

  const handleDeleteUser = async (id: string) => {
    await api.delete(`/admin/users/${id}`);
    setConfirmDelete(null);
    fetchUsers();
    fetchTunnels();
  };

  // --- Tunnel actions ---

  const handleToggleTunnel = async (t: AdminTunnel) => {
    await api.patch(`/admin/tunnels/${t.id}`, { is_active: !t.is_active });
    fetchTunnels();
  };

  // --- Helpers ---

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Administration</h1>
        <div className="flex items-center gap-1 bg-gray-900/50 border border-gray-800/50 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            Utilisateurs ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("tunnels")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === "tunnels"
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <GlobeAltIcon className="w-4 h-4" />
            Tunnels ({tunnels.length})
          </button>
        </div>
      </div>

      {activeTab === "users" ? (
        /* ---- USERS TAB ---- */
        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              Aucun utilisateur
            </p>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-4 bg-gray-900/50 border border-gray-800/50 rounded-xl px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-white font-medium truncate">
                      {u.email}
                    </p>
                    {u.is_admin && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>
                      {u.tunnel_count} / {u.max_tunnels} tunnels
                    </span>
                    <span>·</span>
                    <span>Inscrit le {formatDate(u.created_at)}</span>
                    <span>·</span>
                    {u.is_verified ? (
                      <span className="text-emerald-500">Vérifié</span>
                    ) : (
                      <span className="text-gray-600">Non vérifié</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      u.is_active
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {u.is_active ? "Actif" : "Banni"}
                  </span>

                  {/* Actions (not on self) */}
                  {!u.is_admin && (
                    <>
                      <button
                        onClick={() => handleToggleBan(u)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          u.is_active
                            ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                        }`}
                        title={u.is_active ? "Bannir" : "Débannir"}
                      >
                        <ShieldExclamationIcon className="w-4 h-4" />
                      </button>

                      {confirmDelete === u.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-all cursor-pointer"
                          >
                            Oui
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs font-medium hover:bg-gray-700 transition-all cursor-pointer"
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(u.id)}
                          className="px-3 py-1.5 rounded-lg bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Supprimer"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ---- TUNNELS TAB ---- */
        <div className="space-y-3">
          {tunnels.length === 0 ? (
            <p className="text-center text-gray-500 py-12">Aucun tunnel</p>
          ) : (
            tunnels.map((t) => {
              const status = peerStatus[t.id];
              const connected = status?.connected ?? false;
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-4 bg-gray-900/50 border border-gray-800/50 rounded-xl px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-white font-medium">
                        {t.subdomain}
                        <span className="text-gray-600 font-normal">
                          .homeaccess.site
                        </span>
                      </p>
                      {t.is_active && (
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            connected
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : "bg-gray-800/50 text-gray-500 border border-gray-700/50"
                          }`}
                        >
                          <LinkIcon className="w-3 h-3" />
                          {connected ? "Connecté" : "Déconnecté"}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{t.user_email}</span>
                      <span>·</span>
                      <span>Port {t.target_port}</span>
                      <span>·</span>
                      <span>{t.vpn_ip}</span>
                      <span>·</span>
                      <span>{formatDate(t.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        t.is_active
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-gray-800/50 text-gray-500 border border-gray-700/50"
                      }`}
                    >
                      {t.is_active ? "Actif" : "Inactif"}
                    </span>
                    <button
                      onClick={() => handleToggleTunnel(t)}
                      className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer ${
                        t.is_active ? "bg-indigo-600" : "bg-gray-700"
                      }`}
                    >
                      <div
                        className={`absolute top-0.75 w-4 h-4 rounded-full bg-white transition-transform ${
                          t.is_active ? "translate-x-5" : "translate-x-0.75"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

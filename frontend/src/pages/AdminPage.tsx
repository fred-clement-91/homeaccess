import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import {
  ShieldExclamationIcon,
  TrashIcon,
  LinkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import type { AdminUser, AdminTunnel } from "../types";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h${String(m).padStart(2, "0")}`;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tunnels, setTunnels] = useState<AdminTunnel[]>([]);
  const [peerStatus, setPeerStatus] = useState<
    Record<string, { connected: boolean; connected_since: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmBan, setConfirmBan] = useState<string | null>(null);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchTunnels = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/tunnels");
      setTunnels(data);
    } catch {
      /* ignore */
    }
  }, []);

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
  }, [fetchUsers, fetchTunnels, fetchStatus]);

  useEffect(() => {
    const interval = setInterval(fetchStatus, 5_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    const interval = setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      1_000
    );
    return () => clearInterval(interval);
  }, []);

  // All hooks above — safe to return early below

  if (!user?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const toggleExpand = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const tunnelsByUser: Record<string, AdminTunnel[]> = {};
  for (const t of tunnels) {
    if (!tunnelsByUser[t.user_id]) tunnelsByUser[t.user_id] = [];
    tunnelsByUser[t.user_id].push(t);
  }

  const connectedCount = (userId: string) => {
    const ut = tunnelsByUser[userId] || [];
    return ut.filter((t) => peerStatus[t.id]?.connected).length;
  };

  const handleToggleBan = async (u: AdminUser) => {
    await api.patch(`/admin/users/${u.id}`, { is_active: !u.is_active });
    setConfirmBan(null);
    fetchUsers();
  };

  const handleDeleteUser = async (id: string) => {
    await api.delete(`/admin/users/${id}`);
    setConfirmDelete(null);
    fetchUsers();
    fetchTunnels();
  };

  const handleToggleTunnel = async (t: AdminTunnel) => {
    await api.patch(`/admin/tunnels/${t.id}`, { is_active: !t.is_active });
    fetchTunnels();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Administration</h1>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>
            {users.length} utilisateur{users.length !== 1 ? "s" : ""}
          </span>
          <span>·</span>
          <span>
            {tunnels.length} tunnel{tunnels.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {users.length === 0 ? (
          <p className="text-center text-gray-500 py-12">Aucun utilisateur</p>
        ) : (
          users.map((u) => {
            const userTunnels = tunnelsByUser[u.id] || [];
            const expanded = expandedUsers.has(u.id);
            const connected = connectedCount(u.id);

            return (
              <div
                key={u.id}
                className="bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden"
              >
                {/* ---- User row ---- */}
                <div
                  className={`flex items-center justify-between gap-4 px-5 py-4 transition-colors ${
                    userTunnels.length > 0
                      ? "cursor-pointer hover:bg-gray-800/30"
                      : ""
                  }`}
                  onClick={() => userTunnels.length > 0 && toggleExpand(u.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {userTunnels.length > 0 ? (
                      expanded ? (
                        <ChevronDownIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      )
                    ) : (
                      <div className="w-4 shrink-0" />
                    )}

                    <div className="min-w-0">
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
                          {u.tunnel_count} tunnel
                          {u.tunnel_count !== 1 ? "s" : ""}
                        </span>
                        {connected > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-green-400">
                              {connected} connecté
                              {connected !== 1 ? "s" : ""}
                            </span>
                          </>
                        )}
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
                  </div>

                  <div
                    className="flex items-center gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.is_active
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {u.is_active ? "Actif" : "Banni"}
                    </span>

                    {!u.is_admin && (
                      <>
                        {confirmBan === u.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">
                              {u.is_active ? "Bannir ?" : "Débannir ?"}
                            </span>
                            <button
                              onClick={() => handleToggleBan(u)}
                              className={`px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-all cursor-pointer ${
                                u.is_active
                                  ? "bg-red-600 hover:bg-red-500"
                                  : "bg-emerald-600 hover:bg-emerald-500"
                              }`}
                            >
                              Oui
                            </button>
                            <button
                              onClick={() => setConfirmBan(null)}
                              className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs font-medium hover:bg-gray-700 transition-all cursor-pointer"
                            >
                              Non
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmBan(u.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              u.is_active
                                ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                            }`}
                          >
                            <ShieldExclamationIcon className="w-4 h-4" />
                            {u.is_active ? "Bannir" : "Débannir"}
                          </button>
                        )}

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

                {/* ---- Expanded tunnels ---- */}
                {expanded && userTunnels.length > 0 && (
                  <div className="border-t border-gray-800/50 px-5 pb-4">
                    <div className="space-y-2 pt-3 pl-7">
                      {userTunnels.map((t) => {
                        const status = peerStatus[t.id];
                        const isConnected = status?.connected ?? false;
                        const since = status?.connected_since ?? 0;
                        const duration = since > 0 ? now - since : 0;

                        return (
                          <div
                            key={t.id}
                            className="flex items-center justify-between gap-4 bg-gray-800/40 border border-gray-700/40 rounded-lg px-4 py-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-3">
                                <p className="text-white text-sm font-medium">
                                  {t.subdomain}
                                  <span className="text-gray-600 font-normal">
                                    .homeaccess.site
                                  </span>
                                </p>
                                {t.is_active && (
                                  <div
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                      isConnected
                                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                        : "bg-gray-800/50 text-gray-500 border border-gray-700/50"
                                    }`}
                                  >
                                    <LinkIcon className="w-3 h-3" />
                                    {isConnected
                                      ? `Connecté · ${formatDuration(duration)}`
                                      : "Déconnecté"}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
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
                                    t.is_active
                                      ? "translate-x-5"
                                      : "translate-x-0.75"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

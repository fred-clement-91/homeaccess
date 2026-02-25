import { useEffect, useState, useCallback, useRef } from "react";
import { Navigate } from "react-router-dom";
import {
  ShieldExclamationIcon,
  TrashIcon,
  LinkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UsersIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import api from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import type { AdminUser, AdminTunnel } from "../types";

interface ActivityEntry {
  id: string;
  user_email: string;
  action: string;
  detail: string | null;
  created_at: string;
}

type Tab = "users" | "activity";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  register: { label: "Inscription", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  login: { label: "Connexion", color: "bg-gray-700/50 text-gray-400 border-gray-600/30" },
  tunnel_create: { label: "Création tunnel", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  tunnel_delete: { label: "Suppression tunnel", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  tunnel_toggle: { label: "Toggle tunnel", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  contact_send: { label: "Message contact", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  admin_ban: { label: "Bannissement", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  admin_unban: { label: "Débannissement", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  admin_delete_user: { label: "Suppression compte", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  admin_toggle_tunnel: { label: "Toggle tunnel (admin)", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  admin_update_quota: { label: "Quota modifié", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h${String(m).padStart(2, "0")}`;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("users");

  // Users + tunnels state
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

  // Activity log state
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityOffset, setActivityOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activityLoaded = useRef(false);

  const ACTIVITY_LIMIT = 30;

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

  const fetchActivity = useCallback(
    async (offset = 0, append = false, searchQuery = "") => {
      setActivityLoading(true);
      try {
        const params = new URLSearchParams({
          limit: String(ACTIVITY_LIMIT),
          offset: String(offset),
        });
        if (searchQuery) params.set("search", searchQuery);
        const { data } = await api.get(`/admin/activity?${params}`);
        if (append) {
          setActivity((prev) => [...prev, ...data]);
        } else {
          setActivity(data);
        }
        setHasMore(data.length === ACTIVITY_LIMIT);
        setActivityOffset(offset + data.length);
      } catch {
        /* ignore */
      } finally {
        setActivityLoading(false);
      }
    },
    []
  );

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

  // Load activity when switching to that tab for the first time
  useEffect(() => {
    if (tab === "activity" && !activityLoaded.current) {
      activityLoaded.current = true;
      fetchActivity(0, false, "");
    }
  }, [tab, fetchActivity]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setActiveSearch(value);
      setActivityOffset(0);
      fetchActivity(0, false, value);
    }, 400);
  };

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

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const tabs: { id: Tab; label: string; icon: typeof UsersIcon }[] = [
    { id: "users", label: "Utilisateurs", icon: UsersIcon },
    { id: "activity", label: "Journal", icon: ClockIcon },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900/50 border border-gray-800/50 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer flex-1 justify-center ${
              tab === t.id
                ? "bg-gray-800 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ======== Users tab ======== */}
      {tab === "users" && (
        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              Aucun utilisateur
            </p>
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
                  {/* User row */}
                  <div
                    className={`flex items-center justify-between gap-4 px-5 py-4 transition-colors ${
                      userTunnels.length > 0
                        ? "cursor-pointer hover:bg-gray-800/30"
                        : ""
                    }`}
                    onClick={() =>
                      userTunnels.length > 0 && toggleExpand(u.id)
                    }
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
                          {u.is_beta_tester && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Bêta
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
                          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50 cursor-pointer hover:bg-gray-800 transition-all">
                            <input
                              type="checkbox"
                              checked={u.is_beta_tester}
                              onChange={async () => {
                                await api.patch(`/admin/users/${u.id}`, { is_beta_tester: !u.is_beta_tester });
                                fetchUsers();
                              }}
                              className="accent-purple-500 cursor-pointer"
                            />
                            <span className="text-xs text-gray-400">Compte gratuit</span>
                          </label>

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

                  {/* Expanded tunnels */}
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
                                  <a
                                    href={`https://${t.subdomain}.homeaccess.site`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white font-medium hover:text-indigo-400 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {t.subdomain}
                                    <span className="text-gray-600 font-normal">
                                      .homeaccess.site
                                    </span>
                                  </a>
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
                                  <span>VPN {t.vpn_ip}</span>
                                  <span>·</span>
                                  <span>Device {t.device_ip}</span>
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
      )}

      {/* ======== Activity tab ======== */}
      {tab === "activity" && (
        <div>
          {/* Search bar + refresh */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Rechercher par email, action, détail..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/50 border border-gray-800/50 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
              />
              {search && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs cursor-pointer"
                >
                  Effacer
                </button>
              )}
            </div>
            <button
              onClick={() => fetchActivity(0, false, activeSearch)}
              disabled={activityLoading}
              title="Rafraîchir"
              className="px-3 py-2.5 rounded-xl bg-gray-900/50 border border-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${activityLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Activity list */}
          <div className="space-y-2">
            {activity.length === 0 && !activityLoading ? (
              <p className="text-center text-gray-500 py-12">
                {activeSearch
                  ? "Aucun résultat pour cette recherche"
                  : "Aucune activité enregistrée"}
              </p>
            ) : (
              <>
                {activity.map((entry) => {
                  const actionInfo = ACTION_LABELS[entry.action] || {
                    label: entry.action,
                    color: "bg-gray-700/50 text-gray-400 border-gray-600/30",
                  };

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 bg-gray-900/50 border border-gray-800/50 rounded-lg px-4 py-3"
                    >
                      <span className="text-xs text-gray-500 whitespace-nowrap min-w-[120px]">
                        {formatDateTime(entry.created_at)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${actionInfo.color}`}
                      >
                        {actionInfo.label}
                      </span>
                      <span className="text-sm text-gray-300 truncate">
                        {entry.user_email}
                      </span>
                      {entry.detail && (
                        <span className="text-sm text-gray-500 truncate ml-auto">
                          {entry.detail}
                        </span>
                      )}
                    </div>
                  );
                })}

                {hasMore && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() =>
                        fetchActivity(activityOffset, true, activeSearch)
                      }
                      disabled={activityLoading}
                      className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      {activityLoading ? "Chargement..." : "Charger plus"}
                    </button>
                  </div>
                )}
              </>
            )}

            {activityLoading && activity.length === 0 && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

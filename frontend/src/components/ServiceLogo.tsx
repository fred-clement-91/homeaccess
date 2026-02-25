import type { ReactNode } from "react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";

interface Props {
  serviceType: string | null;
  className?: string;
}

const SERVICES: Record<string, { name: string; color: string; icon: ReactNode }> = {
  homeassistant: {
    name: "Home Assistant",
    color: "from-sky-500/20 to-blue-500/20",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-sky-400">
        <path d="M12 2L3 9v12a1 1 0 001 1h6v-7h4v7h6a1 1 0 001-1V9l-9-7z" />
      </svg>
    ),
  },
  jellyfin: {
    name: "Jellyfin",
    color: "from-purple-500/20 to-fuchsia-500/20",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-purple-400">
        <path d="M12 2C8.5 2 5.5 5 4 8.5c2 1 4.5 1.5 8 1.5s6-0.5 8-1.5C18.5 5 15.5 2 12 2zM12 12c-3.5 0-6 0.5-8 1.5C5.5 17 8.5 22 12 22s6.5-5 8-8.5c-2-1-4.5-1.5-8-1.5z" />
      </svg>
    ),
  },
  plex: {
    name: "Plex",
    color: "from-amber-500/20 to-yellow-500/20",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-400">
        <path d="M4.5 3L12 12l-7.5 9h5L17 12 9.5 3h-5zm5 0L17 12l-7.5 9h5L22 12 14.5 3h-5z" />
      </svg>
    ),
  },
  nextcloud: {
    name: "Nextcloud",
    color: "from-blue-500/20 to-cyan-500/20",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400">
        <path d="M12 6a6 6 0 00-5.8 4.5A4.5 4.5 0 002 15a4.5 4.5 0 004.5 4.5h11A4.5 4.5 0 0022 15a4.5 4.5 0 00-4.2-4.5A6 6 0 0012 6z" />
      </svg>
    ),
  },
  camera: {
    name: "Caméra IP",
    color: "from-rose-500/20 to-red-500/20",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-rose-400">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3.5a3 3 0 110 6 3 3 0 010-6zM12 20c-2.03 0-3.86-.77-5.25-2.03A6.98 6.98 0 0112 14.5c2.17 0 4.13.98 5.25 2.47A7.96 7.96 0 0112 20z" />
      </svg>
    ),
  },
  http: {
    name: "HTTP",
    color: "from-gray-500/20 to-slate-500/20",
    icon: <GlobeAltIcon className="w-5 h-5 text-gray-400" />,
  },
};

export default function ServiceLogo({ serviceType, className = "" }: Props) {
  const service = serviceType ? SERVICES[serviceType] : null;

  if (!service) {
    return (
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 ${className}`} title={serviceType || "Autre"}>
        <GlobeAltIcon className="w-5 h-5 text-indigo-400" />
      </div>
    );
  }

  return (
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center flex-shrink-0 ${className}`} title={service.name}>
      {service.icon}
    </div>
  );
}

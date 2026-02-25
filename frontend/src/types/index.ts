export interface User {
  id: string;
  email: string;
  is_admin: boolean;
  is_beta_tester: boolean;
  max_tunnels: number;
  tunnel_count: number;
}

export interface Tunnel {
  id: string;
  subdomain: string;
  target_port: number;
  service_type: string | null;
  vpn_ip: string;
  device_ip: string;
  use_device_ip: boolean;
  is_active: boolean;
  full_domain: string;
  created_at: string;
  updated_at: string;
}

export interface SubdomainCheck {
  subdomain: string;
  available: boolean;
}

// --- Admin types ---

export interface AdminUser {
  id: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  is_beta_tester: boolean;
  max_tunnels: number;
  tunnel_count: number;
  created_at: string;
}

export interface AdminTunnel {
  id: string;
  user_id: string;
  user_email: string;
  subdomain: string;
  target_port: number;
  service_type: string | null;
  vpn_ip: string;
  device_ip: string;
  use_device_ip: boolean;
  is_active: boolean;
  full_domain: string;
  created_at: string;
}

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Flag,
  Gauge,
  MapPinned,
  Settings,
  Shield,
  Users,
} from "lucide-react";

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const navigationItems: NavigationItem[] = [
  { href: "/", label: "Dashboard", icon: Gauge, description: "Genel saglik ve sayaçlar" },
  { href: "/users", label: "Kullanicilar", icon: Users, description: "Arama, rol ve detaylar" },
  { href: "/communities", label: "Topluluklar", icon: Shield, description: "Topluluk listesi ve yonetim" },
  { href: "/pins", label: "Pinler", icon: MapPinned, description: "Isletme dogrulama sirasi" },
  { href: "/reports", label: "Sikayetler", icon: Flag, description: "Moderasyon kuyrugu" },
  { href: "/analytics", label: "Analitik", icon: BarChart3, description: "Metrikler ve trendler" },
  { href: "/settings", label: "Ayarlar", icon: Settings, description: "Feature flag ve panel ayarlari" },
];

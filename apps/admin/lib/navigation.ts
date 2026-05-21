import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  BookText,
  BriefcaseBusiness,
  CalendarRange,
  CircuitBoard,
  FileStack,
  Flag,
  Gauge,
  HeartPulse,
  Image,
  KeyRound,
  LifeBuoy,
  MapPinned,
  MessageSquare,
  Search,
  ScrollText,
  Settings,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Users,
  Waves,
} from "lucide-react";

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const navigationItems: NavigationItem[] = [
  { href: "/", label: "Dashboard", icon: Gauge, description: "Genel sağlık ve sayaçlar" },
  { href: "/users", label: "Kullanıcılar", icon: Users, description: "Arama, rol ve detaylar" },
  { href: "/communities", label: "Topluluklar", icon: Shield, description: "Topluluk listesi ve yönetim" },
  { href: "/pins", label: "Pinler", icon: MapPinned, description: "İşletme doğrulama sırası" },
  { href: "/posts", label: "Post Moderasyonu", icon: Image, description: "Gönderi kuyruğu ve aksiyonlar" },
  { href: "/comments", label: "Yorum Moderasyonu", icon: MessageSquare, description: "Yorum kuyruğu ve hızlı aksiyonlar" },
  { href: "/stories", label: "Story Moderasyonu", icon: Sparkles, description: "Aktif story kuyruğu ve acil müdahale" },
  { href: "/feed-overrides", label: "Feed Override", icon: SlidersHorizontal, description: "Trend listesi ve manuel feature/shadowban" },
  { href: "/events", label: "Etkinlikler", icon: CalendarRange, description: "Yaklaşan community event kuyruğu" },
  { href: "/community-needs", label: "Community Needs", icon: CircuitBoard, description: "Yedek parça ve yardım ilanlarında spam sinyali" },
  { href: "/business/applications", label: "İşletme Başvuruları", icon: BriefcaseBusiness, description: "Onay bekleyen işletme onboarding kuyruğu" },
  { href: "/reports", label: "Şikayetler", icon: Flag, description: "Moderasyon kuyruğu" },
  { href: "/help-requests", label: "Yardım Talepleri", icon: LifeBuoy, description: "Acil yardım kuyruğu ve durumlar" },
  { href: "/invites", label: "Davet Kodları", icon: KeyRound, description: "Toplu kod üretimi ve kullanım" },
  { href: "/waiting-list", label: "Bekleme Listesi", icon: Waves, description: "Wave invite ve aday havuzu" },
  { href: "/analytics", label: "Analitik", icon: BarChart3, description: "Metrikler ve trendler" },
  { href: "/status", label: "Durum Sayfası", icon: HeartPulse, description: "Incident ve servis sağlığı yönetimi" },
  { href: "/community-rules", label: "Topluluk Kuralları", icon: BookText, description: "TR-EN kural metni ve yayın notu" },
  { href: "/data-exports", label: "Veri Talepleri", icon: FileStack, description: "KVKK ve GDPR dışa aktarma takibi" },
  { href: "/support-search", label: "Destek Arama", icon: Search, description: "E-posta, kullanıcı adı ve telefon ara" },
  { href: "/notifications", label: "Bildirimler", icon: Bell, description: "Sistem duyuruları gönder" },
  { href: "/audit", label: "Audit Log", icon: ScrollText, description: "Aksiyon geçmişi ve filtreler" },
  { href: "/settings", label: "Ayarlar", icon: Settings, description: "Feature flag ve panel ayarları" },
];

import {
  BarChart3,
  Car,
  Fuel,
  Home,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the mobile tab bar */
  shortLabel?: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Översikt", icon: Home },
  { href: "/tankningar", label: "Tankningar", icon: Fuel },
  { href: "/statistik", label: "Statistik", icon: BarChart3 },
  { href: "/bilar", label: "Bilar", icon: Car },
  { href: "/installningar", label: "Inställningar", shortLabel: "Mer", icon: Settings },
];

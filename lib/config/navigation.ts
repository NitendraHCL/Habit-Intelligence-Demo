import {
  LayoutDashboard,
  Stethoscope,
  Activity,
  Heart,
  RefreshCw,
  Brain,
  ClipboardCheck,
  BarChart3,
  Users,
  ThumbsUp,
  Dumbbell,
  Bell,
  Smartphone,
  GitBranch,
  ListChecks,
  ShieldCheck,
  Wallet,
  UserCheck,
  ReceiptText,
  Timer,
  MessageSquareWarning,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  external?: boolean;
  walkthroughId?: string;
  children?: NavItem[];
}

export const navigation: NavItem[] = [
  {
    label: "Overview",
    href: "/portal/home",
    icon: LayoutDashboard,
  },
  {
    label: "OHC",
    href: "/portal/ohc",
    icon: Stethoscope,
    walkthroughId: "nav-ohc",
    children: [
      { label: "Utilisation", href: "/portal/ohc/utilization", icon: Activity },
      { label: "Referral", href: "/portal/ohc/referral", icon: GitBranch },
      { label: "Emotional Wellbeing", href: "/portal/ohc/emotional-wellbeing", icon: Heart },
      { label: "Repeat Visits", href: "/portal/ohc/repeat-visits", icon: RefreshCw },
      { label: "Health Insights", href: "/portal/ohc/health-insights", icon: Brain },
    ],
  },
  {
    label: "AHC",
    href: "/portal/ahc",
    icon: ClipboardCheck,
    walkthroughId: "nav-ahc",
    children: [
      { label: "Utilisation", href: "https://facility.habithealth.com/health-dashboard", icon: BarChart3, external: true },
      { label: "Comparison Insights", href: "https://facility.habithealth.com/health-dashboard/comparison", icon: BarChart3, external: true },
      { label: "Action Plan", href: "https://facility.habithealth.com/health-dashboard/action-plan", icon: ListChecks, external: true },
    ],
  },
  {
    label: "OPD Wallet Analytics",
    href: "/portal/opd-wallet",
    icon: Wallet,
    walkthroughId: "nav-opd-wallet",
    children: [
      { label: "Registration Status", href: "/portal/opd-wallet/registration", icon: UserCheck },
      { label: "Utilisation", href: "/portal/opd-wallet/utilisation", icon: Activity },
      { label: "Reimbursement", href: "/portal/opd-wallet/reimbursement", icon: ReceiptText },
      { label: "Claims TAT & MIS", href: "/portal/opd-wallet/claims-mis", icon: Timer },
      { label: "User Feedback", href: "/portal/opd-wallet/user-feedback", icon: MessageSquareWarning },
    ],
  },
  {
    label: "Compliance",
    href: "/portal/compliance",
    icon: ShieldCheck,
    walkthroughId: "nav-compliance",
  },
  {
    label: "Employee Experience",
    href: "/portal/employee-experience",
    icon: Users,
    walkthroughId: "nav-ee",
    children: [
      { label: "NPS", href: "/portal/employee-experience/nps", icon: ThumbsUp },
      { label: "LSMP", href: "/portal/employee-experience/lsmp", icon: Dumbbell },
      { label: "Alerts & Surveys", href: "/portal/employee-experience/alerts-surveys", icon: Bell },
    ],
  },
  {
    label: "App Engagement",
    href: "/portal/engagement",
    icon: Smartphone,
    walkthroughId: "nav-engagement",
  },
  {
    label: "Correlations",
    href: "/portal/correlations",
    icon: GitBranch,
    walkthroughId: "nav-correlations",
  },
  {
    label: "Action Plan",
    href: "/portal/action-plan",
    icon: ListChecks,
    walkthroughId: "nav-action-plan",
  },
];

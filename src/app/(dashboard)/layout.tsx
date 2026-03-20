import { DashboardLayout } from "@/components/layout/dashboard/DashboardLayout";

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}


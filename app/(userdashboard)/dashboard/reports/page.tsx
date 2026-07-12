import RoleGuard from "@/components/auth/RoleGuard";
import ReportsView from "@/components/userdashboard/reports/ReportsView";

export default function ReportsPage() {
  return (
    <RoleGuard allow={["admin", "project_manager"]}>
      <ReportsView />
    </RoleGuard>
  );
}

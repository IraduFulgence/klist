import RoleGuard from "@/components/auth/RoleGuard";
import DepartmentsView from "@/components/userdashboard/departments/DepartmentsView";

export default function DepartmentsPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <DepartmentsView />
    </RoleGuard>
  );
}

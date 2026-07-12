import RoleGuard from "@/components/auth/RoleGuard";
import EmployeesView from "@/components/userdashboard/employees/EmployeesView";

export default function TeamPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <EmployeesView />
    </RoleGuard>
  );
}

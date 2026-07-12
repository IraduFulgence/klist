import RoleGuard from "@/components/auth/RoleGuard";
import OrgSettingsView from "@/components/userdashboard/settings/OrgSettingsView";

export default function SettingsPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <OrgSettingsView />
    </RoleGuard>
  );
}

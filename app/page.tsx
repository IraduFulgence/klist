import LoginPage from "./auth/login/page";
import GuestGuard from "@/components/auth/GuestGuard";

export default function Home() {
  return (
    <GuestGuard>
      <LoginPage />
    </GuestGuard>
  );
}

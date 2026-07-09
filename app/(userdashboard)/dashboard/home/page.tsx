import Overview from "@/components/userdashboard/home/overview";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard",
};

export default function Home() {
  return <Overview />;
}
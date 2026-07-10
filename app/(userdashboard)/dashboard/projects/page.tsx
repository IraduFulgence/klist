import { Metadata } from "next";
import ProjectsView from "@/components/userdashboard/projects/ProjectsView";

export const metadata: Metadata = {
  title: "Projects",
  description: "Your projects and boards",
};

export default function ProjectsPage() {
  return <ProjectsView />;
}

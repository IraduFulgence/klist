import { Metadata } from "next";
import TasksView from "@/components/userdashboard/tasks/TasksView";

export const metadata: Metadata = {
  title: "My Tasks",
  description: "All tasks assigned to or created by you",
};

export default function TasksPage() {
  return <TasksView />;
}

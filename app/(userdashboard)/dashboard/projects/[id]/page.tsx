import BoardView from "@/components/userdashboard/projects/BoardView";

export default async function ProjectBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BoardView projectId={Number(id)} />;
}

import { redirect } from "next/navigation";
import { BackStepButton } from "@/components/ui/back-step-button";
import { MeetingNotesPageClient } from "@/components/frameworks/meeting-notes/meeting-notes-page-client";
import { getFrameworkMeetingNotes } from "@/features/frameworks/data/framework-meeting-note-repository";
import { getProfiles } from "@/features/profiles/data/profile-repository";
import { getProjectById } from "@/features/projects/data/project-repository";

type ProjectMeetingNotesPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ pv?: string }>;
};

export default async function ProjectMeetingNotesPage({ params, searchParams }: ProjectMeetingNotesPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedProjectVersion = Number.parseInt(resolvedSearchParams?.pv ?? "", 10);

  const project = await getProjectById(id);
  if (!project) {
    redirect("/projects");
  }

  const [notes, profiles] = await Promise.all([
    getFrameworkMeetingNotes(id),
    getProfiles(),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <BackStepButton
          fallbackHref={
            Number.isFinite(selectedProjectVersion)
              ? `/project/${id}?pv=${selectedProjectVersion}`
              : `/project/${id}`
          }
          label="프로젝트 홈으로"
        />
        <p className="text-sm text-gray-400">프로젝트 · 프레임워크 회의록</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{project.name}</h1>
      </header>

      <MeetingNotesPageClient projectId={id} notes={notes} profiles={profiles} />
    </div>
  );
}

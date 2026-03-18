import { redirect } from "next/navigation";
import { PersonaModelCanvas } from "@/components/frameworks/persona-model/persona-model-canvas";
import { BackStepButton } from "@/components/ui/back-step-button";
import { FrameworkVersionManager } from "@/components/ui/framework-version-manager";
import {
	getFrameworkByKey,
	getFrameworkByVersion,
	getFrameworkVersionsByKey,
} from "@/features/frameworks/data/framework-repository";
import { getProjectById } from "@/features/projects/data/project-repository";

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams?: Promise<{ fv?: string; pv?: string }>;
};

type PersonaData = {
	name: string;
	age: string;
	role: string;
	bio: string;
	goals: string;
	painPoints: string;
	behaviors: string;
	needs: string;
	motivations: string;
};

function getDefaultData(): PersonaData {
	return {
		name: "Alex Kim",
		age: "31",
		role: "Product Manager",
		bio: "데이터 기반으로 빠르게 우선순위를 정하고 팀을 정렬하고 싶어하는 실무 리더",
		goals: "팀 목표 정렬, 의사결정 속도 향상",
		painPoints: "정보 파편화, 회의 과다",
		behaviors: "주간 리뷰, KPI 모니터링",
		needs: "명확한 프레임워크와 기록",
		motivations: "높은 실행력과 가시적 성과",
	};
}

function parseData(raw: string | null): PersonaData {
	if (!raw) return getDefaultData();
	try {
		const parsed = JSON.parse(raw) as Partial<PersonaData>;
		return { ...getDefaultData(), ...parsed };
	} catch {
		return getDefaultData();
	}
}

export default async function ProjectPersonaModelPage({ params, searchParams }: PageProps) {
	const { id } = await params;
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const selectedVersion = Number.parseInt(resolvedSearchParams?.fv ?? "", 10);
	const selectedProjectVersion = Number.parseInt(resolvedSearchParams?.pv ?? "", 10);

	const project = await getProjectById(id);
	if (!project) {
		redirect("/projects");
	}

	const frameworkVersions = await getFrameworkVersionsByKey(id, "PERSONA_MODEL");
	const framework = Number.isFinite(selectedVersion)
		? await getFrameworkByVersion(id, "PERSONA_MODEL", selectedVersion)
		: await getFrameworkByKey(id, "PERSONA_MODEL");

	if (!Number.isFinite(selectedVersion) && framework) {
		const query = new URLSearchParams({ fv: String(framework.version) });
		if (Number.isFinite(selectedProjectVersion)) {
			query.set("pv", String(selectedProjectVersion));
		}
		redirect(`/project/${id}/persona-model?${query.toString()}`);
	}

	if (Number.isFinite(selectedVersion) && !framework) {
		const fallbackVersion = frameworkVersions[0]?.version;
		if (fallbackVersion) {
			const query = new URLSearchParams({ fv: String(fallbackVersion) });
			if (Number.isFinite(selectedProjectVersion)) {
				query.set("pv", String(selectedProjectVersion));
			}
			redirect(`/project/${id}/persona-model?${query.toString()}`);
		}

		redirect(
			Number.isFinite(selectedProjectVersion)
				? `/project/${id}/persona-model?pv=${selectedProjectVersion}`
				: `/project/${id}/persona-model`,
		);
	}

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
				<p className="text-sm text-gray-400">프레임워크 · Persona Model</p>
				<h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{project.name}</h1>
			</header>

			<FrameworkVersionManager
				projectId={id}
				frameworkKey="PERSONA_MODEL"
				basePath={`/project/${id}/persona-model`}
				projectVersion={Number.isFinite(selectedProjectVersion) ? selectedProjectVersion : null}
				currentFrameworkId={framework?.id ?? null}
				currentVersion={framework?.version ?? null}
				versions={frameworkVersions}
			/>

			<PersonaModelCanvas
				projectId={id}
				frameworkId={framework?.id ?? null}
				initialData={parseData(framework?.title ?? null)}
			/>
		</div>
	);
}


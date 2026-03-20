import { redirect } from "next/navigation";
import { McKinsey7SCanvas } from "@/components/frameworks/mckinsey-7s/mckinsey-7s-canvas";
import { BackStepButton } from "@/components/ui/back-step-button";
import { FrameworkVersionManager } from "@/components/ui/framework-version-manager";
import { getFrameworkByKey, getFrameworkByVersion, getFrameworkVersionsByKey } from "@/features/frameworks/data/framework-repository";
import { getProjectById, getProjectVersions } from "@/features/projects/data/project-repository";

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams?: Promise<{ fv?: string; pv?: string }>;
};

type SevenSNode = {
	title: string;
	description: string;
};

type SevenSData = {
	sharedValues: SevenSNode;
	strategy: SevenSNode;
	structure: SevenSNode;
	systems: SevenSNode;
	style: SevenSNode;
	staff: SevenSNode;
	skills: SevenSNode;
};

function getDefaultData(): SevenSData {
	return {
		sharedValues: { title: "핵심 가치", description: "조직의 공통 가치와 문화" },
		strategy: { title: "전략", description: "전략 방향" },
		structure: { title: "구조", description: "조직 구조" },
		systems: { title: "시스템", description: "운영 시스템" },
		style: { title: "스타일", description: "리더십 스타일" },
		staff: { title: "인력", description: "인력 구성" },
		skills: { title: "역량", description: "핵심 역량" },
	};
}

function parseData(raw: string | null): SevenSData {
	if (!raw) return getDefaultData();
	try {
		const parsed = JSON.parse(raw) as Partial<SevenSData> & Record<string, unknown>;
		const defaults = getDefaultData();

		const normalize = (key: keyof SevenSData): SevenSNode => {
			const incoming = parsed[key] as unknown;
			if (typeof incoming === "string") {
				return { title: "", description: incoming };
			}
			if (incoming && typeof incoming === "object") {
				const value = incoming as { title?: unknown; description?: unknown };
				return {
					title: typeof value.title === "string" ? value.title : defaults[key].title,
					description: typeof value.description === "string" ? value.description : defaults[key].description,
				};
			}
			return defaults[key];
		};

		return {
			sharedValues: normalize("sharedValues"),
			strategy: normalize("strategy"),
			structure: normalize("structure"),
			systems: normalize("systems"),
			style: normalize("style"),
			staff: normalize("staff"),
			skills: normalize("skills"),
		};
	} catch {
		return getDefaultData();
	}
}

export default async function ProjectMcKinsey7SPage({ params, searchParams }: PageProps) {
	const { id } = await params;
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const selectedVersion = Number.parseInt(resolvedSearchParams?.fv ?? "", 10);
	const selectedProjectVersion = Number.parseInt(resolvedSearchParams?.pv ?? "", 10);

	const [project, projectVersions] = await Promise.all([getProjectById(id), getProjectVersions(id)]);
	const hasProjectVersion = projectVersions.length > 0;
	if (!project) {
		redirect("/projects");
	}

	const frameworkVersions = await getFrameworkVersionsByKey(id, "MCKINSEY_7S");
	const framework = Number.isFinite(selectedVersion)
		? await getFrameworkByVersion(id, "MCKINSEY_7S", selectedVersion)
		: await getFrameworkByKey(id, "MCKINSEY_7S");

	if (!Number.isFinite(selectedVersion) && framework) {
		const query = new URLSearchParams({ fv: String(framework.version) });
		if (Number.isFinite(selectedProjectVersion)) {
			query.set("pv", String(selectedProjectVersion));
		}
		redirect(`/project/${id}/mckinsey-7s?${query.toString()}`);
	}

	if (Number.isFinite(selectedVersion) && !framework) {
		const fallbackVersion = frameworkVersions[0]?.version;
		if (fallbackVersion) {
			const query = new URLSearchParams({ fv: String(fallbackVersion) });
			if (Number.isFinite(selectedProjectVersion)) {
				query.set("pv", String(selectedProjectVersion));
			}
			redirect(`/project/${id}/mckinsey-7s?${query.toString()}`);
		}

		redirect(
			Number.isFinite(selectedProjectVersion)
				? `/project/${id}/mckinsey-7s?pv=${selectedProjectVersion}`
				: `/project/${id}/mckinsey-7s`,
		);
	}

	return (
		<div className="space-y-8">
			<header>
				<BackStepButton
					fallbackHref={Number.isFinite(selectedProjectVersion) ? `/project/${id}?pv=${selectedProjectVersion}` : `/project/${id}`}
					label="프로젝트 홈으로"
				/>
				<p className="text-sm text-gray-400">프레임워크 · McKinsey 7S</p>
				<h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{project.name}</h1>
			</header>

			<FrameworkVersionManager
				projectId={id}
				frameworkKey="MCKINSEY_7S"
				basePath={`/project/${id}/mckinsey-7s`}
				projectVersion={Number.isFinite(selectedProjectVersion) ? selectedProjectVersion : null}
				hasProjectVersion={hasProjectVersion}
				currentFrameworkId={framework?.id ?? null}
				currentVersion={framework?.version ?? null}
				versions={frameworkVersions}
			/>

			<McKinsey7SCanvas
				key={framework?.id ?? "mckinsey-7s-empty"}
				projectId={id}
				frameworkId={framework?.id ?? null}
				currentVersion={framework?.version ?? null}
				initialData={parseData(framework?.title ?? null)}
			/>
		</div>
	);
}

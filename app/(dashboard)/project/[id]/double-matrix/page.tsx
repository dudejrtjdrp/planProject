import { redirect } from "next/navigation";
import { DoubleMatrixBoard } from "@/components/frameworks/double-matrix/double-matrix-board";
import { BackStepButton } from "@/components/ui/back-step-button";
import { FrameworkVersionManager } from "@/components/ui/framework-version-manager";
import { getFrameworkByKey, getFrameworkByVersion, getFrameworkVersionsByKey } from "@/features/frameworks/data/framework-repository";
import { getProjectById, getProjectVersions } from "@/features/projects/data/project-repository";

type PageProps = {
	params: Promise<{ id: string }>;
	searchParams?: Promise<{ fv?: string; pv?: string }>;
};

type MatrixData = {
	xAxis: string;
	yAxis: string;
	q1: string;
	q2: string;
	q3: string;
	q4: string;
};

function getDefaultData(): MatrixData {
	return {
		xAxis: "영향도",
		yAxis: "실행 난이도",
		q1: "빠른 승리",
		q2: "전략 투자",
		q3: "점진 개선",
		q4: "우선순위 제외",
	};
}

function parseData(raw: string | null): MatrixData {
	if (!raw) return getDefaultData();
	try {
		const parsed = JSON.parse(raw) as Partial<MatrixData>;
		return { ...getDefaultData(), ...parsed };
	} catch {
		return getDefaultData();
	}
}

export default async function ProjectDoubleMatrixPage({ params, searchParams }: PageProps) {
	const { id } = await params;
	const resolvedSearchParams = searchParams ? await searchParams : undefined;
	const selectedVersion = Number.parseInt(resolvedSearchParams?.fv ?? "", 10);
	const selectedProjectVersion = Number.parseInt(resolvedSearchParams?.pv ?? "", 10);

	const [project, projectVersions] = await Promise.all([getProjectById(id), getProjectVersions(id)]);
	const hasProjectVersion = projectVersions.length > 0;
	if (!project) {
		redirect("/projects");
	}

	const frameworkVersions = await getFrameworkVersionsByKey(id, "MATRIX_2X2");
	const framework = Number.isFinite(selectedVersion)
		? await getFrameworkByVersion(id, "MATRIX_2X2", selectedVersion)
		: await getFrameworkByKey(id, "MATRIX_2X2");

	if (!Number.isFinite(selectedVersion) && framework) {
		const query = new URLSearchParams({ fv: String(framework.version) });
		if (Number.isFinite(selectedProjectVersion)) {
			query.set("pv", String(selectedProjectVersion));
		}
		redirect(`/project/${id}/double-matrix?${query.toString()}`);
	}

	if (Number.isFinite(selectedVersion) && !framework) {
		const fallbackVersion = frameworkVersions[0]?.version;
		if (fallbackVersion) {
			const query = new URLSearchParams({ fv: String(fallbackVersion) });
			if (Number.isFinite(selectedProjectVersion)) {
				query.set("pv", String(selectedProjectVersion));
			}
			redirect(`/project/${id}/double-matrix?${query.toString()}`);
		}

		redirect(
			Number.isFinite(selectedProjectVersion)
				? `/project/${id}/double-matrix?pv=${selectedProjectVersion}`
				: `/project/${id}/double-matrix`,
		);
	}

	return (
		<div className="space-y-8">
			<header>
				<BackStepButton
					fallbackHref={Number.isFinite(selectedProjectVersion) ? `/project/${id}?pv=${selectedProjectVersion}` : `/project/${id}`}
					label="프로젝트 홈으로"
				/>
				<p className="text-sm text-gray-400">프레임워크 · Double Matrix</p>
				<h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{project.name}</h1>
			</header>

			<FrameworkVersionManager
				projectId={id}
				frameworkKey="MATRIX_2X2"
				basePath={`/project/${id}/double-matrix`}
				projectVersion={Number.isFinite(selectedProjectVersion) ? selectedProjectVersion : null}
				hasProjectVersion={hasProjectVersion}
				currentFrameworkId={framework?.id ?? null}
				currentVersion={framework?.version ?? null}
				versions={frameworkVersions}
			/>

			<DoubleMatrixBoard
				key={framework?.id ?? "double-matrix-empty"}
				projectId={id}
				frameworkId={framework?.id ?? null}
				currentVersion={framework?.version ?? null}
				initialData={parseData(framework?.title ?? null)}
			/>
		</div>
	);
}

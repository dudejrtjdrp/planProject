"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormPendingOverlay } from "@/components/ui/form-pending-overlay";
import { pushToast } from "@/lib/utils/toast";
import {
  createProjectVersionAction,
  getProjectVersionSnapshotAction,
  restoreProjectVersionAction,
} from "@/features/projects/actions/project-version-actions";
import { CURRENT_USER_KEY } from "@/lib/config/profile-storage";
import type { ProjectVersion } from "@/features/projects/data/project-repository";
import { diffJson, formatDiffValue } from "@/features/projects/utils/json-diff";

type ProjectVersionManagerProps = {
	projectId: string;
	currentVersion: number | null;
	versions: ProjectVersion[];
	currentProjectUpdatedAt: string;
};

export function ProjectVersionManager({
	projectId,
	currentVersion,
	versions,
	currentProjectUpdatedAt,
}: ProjectVersionManagerProps) {
	const router = useRouter();
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [isNavigating, setIsNavigating] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
	const [selectedVersion, setSelectedVersion] = useState<number | null>(versions[0]?.version ?? null);
	const [compareVersion, setCompareVersion] = useState<number | null>(versions[1]?.version ?? null);
	const [selectedSnapshot, setSelectedSnapshot] = useState<ProjectVersion | null>(null);
	const [compareSnapshot, setCompareSnapshot] = useState<ProjectVersion | null>(null);
	const [editorName, setEditorName] = useState("");
	const [commitMessage, setCommitMessage] = useState("");
	const [isDraftMode, setIsDraftMode] = useState(false);
	const [autoDraftEnabled, setAutoDraftEnabled] = useState(false);
	const pendingVersionRef = useRef<number | null>(null);
	const snapshotCacheRef = useRef<Map<number, ProjectVersion>>(new Map());

	useEffect(() => {
		const saved = window.localStorage.getItem(CURRENT_USER_KEY) ?? "";
		setEditorName(saved);
	}, []);

	useEffect(() => {
		if (!selectedVersion) {
			setSelectedSnapshot(null);
			return;
		}

		const cached = snapshotCacheRef.current.get(selectedVersion);
		if (cached) {
			setSelectedSnapshot(cached);
			return;
		}

		setIsLoadingSnapshot(true);
		getProjectVersionSnapshotAction({ projectId, version: selectedVersion })
			.then((result) => {
				if (result.version) {
					snapshotCacheRef.current.set(selectedVersion, result.version);
					setSelectedSnapshot(result.version);
				}
			})
			.catch((error) => {
				const message = error instanceof Error ? error.message : "버전 스냅샷을 불러오지 못했습니다.";
				pushToast(message, "error");
			})
			.finally(() => setIsLoadingSnapshot(false));
	}, [projectId, selectedVersion]);

	useEffect(() => {
		if (!compareVersion) {
			setCompareSnapshot(null);
			return;
		}

		const cached = snapshotCacheRef.current.get(compareVersion);
		if (cached) {
			setCompareSnapshot(cached);
			return;
		}

		getProjectVersionSnapshotAction({ projectId, version: compareVersion })
			.then((result) => {
				if (result.version) {
					snapshotCacheRef.current.set(compareVersion, result.version);
					setCompareSnapshot(result.version);
				}
			})
			.catch((error) => {
				const message = error instanceof Error ? error.message : "비교 스냅샷을 불러오지 못했습니다.";
				pushToast(message, "error");
			});
	}, [compareVersion, projectId]);

	useEffect(() => {
		if (!autoDraftEnabled) {
			return;
		}

		const intervalId = window.setInterval(() => {
			startTransition(async () => {
				try {
					const result = await createProjectVersionAction({
						projectId,
						editorName: editorName || null,
						commitMessage: "Auto-save draft",
						isDraft: true,
					});
					pushToast(`Draft v${result.version} 자동 저장`);
					router.refresh();
				} catch {
					pushToast("자동 Draft 저장 실패", "error");
				}
			});
		}, 180000);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [autoDraftEnabled, editorName, projectId, router, startTransition]);

	const diffEntries = useMemo(() => {
		if (!selectedSnapshot?.snapshot) {
			return [];
		}

		const before = compareSnapshot?.snapshot ?? {};
		const after = selectedSnapshot.snapshot;
		return diffJson(before, after);
	}, [compareSnapshot?.snapshot, selectedSnapshot?.snapshot]);

	function goVersion(version: number) {
		if (currentVersion === version) {
			return;
		}

		pendingVersionRef.current = version;
		setIsNavigating(true);
		router.push(`/project/${projectId}?pv=${version}`);
	}

	function handleCreateVersion() {
		startTransition(async () => {
			try {
				const result = await createProjectVersionAction({
					projectId,
					editorName: editorName || null,
					commitMessage: commitMessage || null,
					isDraft: isDraftMode,
				});
				pushToast(`${isDraftMode ? "Draft" : "프로젝트"} v${result.version} 생성 완료`);
				pendingVersionRef.current = result.version;
				setIsNavigating(true);
				setCommitMessage("");
				router.push(`/project/${projectId}?pv=${result.version}`);
			} catch (error) {
				const message = error instanceof Error ? error.message : "프로젝트 버전 생성에 실패했습니다.";
				pushToast(message, "error");
			}
		});
	}

	function handleRestoreVersion(version: number) {
		startTransition(async () => {
			try {
				await restoreProjectVersionAction({
					projectId,
					version,
					expectedUpdatedAt: currentProjectUpdatedAt,
					editorName: editorName || null,
				});
				pushToast(`v${version} 상태로 복원되었습니다.`);
				router.refresh();
				setIsDrawerOpen(false);
			} catch (error) {
				const message = error instanceof Error ? error.message : "버전 복원에 실패했습니다.";
				pushToast(message, "error");
			}
		});
	}

	return (
		<>
			<div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
				{isNavigating || isPending ? <FormPendingOverlay visible message="버전 데이터를 불러오는 중..." /> : null}
				<div className="flex flex-wrap items-center gap-2">
					<p className="mr-2 text-sm font-medium text-gray-600">프로젝트 버전</p>
					{versions.map((versionItem) => {
						const active = currentVersion === versionItem.version;
						return (
							<button
								key={versionItem.id}
								type="button"
								onClick={() => goVersion(versionItem.version)}
								className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
									active
										? "border-[#3182F6] bg-blue-50 text-[#3182F6]"
										: "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
								}`}
							>
								v{versionItem.version}
							</button>
						);
					})}
					<button
						type="button"
						onClick={handleCreateVersion}
						disabled={isPending}
						className="rounded-lg bg-[#3182F6] px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-blue-200"
					>
						{isPending ? "생성 중..." : "+ 새 버전"}
					</button>
					<button
						type="button"
						onClick={() => setIsDrawerOpen(true)}
						className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
					>
						Version History
					</button>
				</div>
			</div>

			{isDrawerOpen ? (
				<div className="fixed inset-0 z-[80]">
					<button
						type="button"
						onClick={() => setIsDrawerOpen(false)}
						className="absolute inset-0 bg-gray-900/20"
						aria-label="close-version-history"
					/>
					<aside className="absolute right-0 top-0 h-full w-full max-w-3xl border-l border-gray-200 bg-white shadow-2xl">
						<div className="flex h-full flex-col">
							<header className="border-b border-gray-200 p-5">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Project</p>
										<h3 className="mt-1 text-lg font-semibold text-gray-900">Version History</h3>
									</div>
									<button
										type="button"
										onClick={() => setIsDrawerOpen(false)}
										className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600"
									>
										닫기
									</button>
								</div>
								<div className="mt-4 grid gap-3 md:grid-cols-2">
									<input
										type="text"
										value={commitMessage}
										onChange={(event) => setCommitMessage(event.target.value)}
										placeholder="커밋 메시지 (선택)"
										className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
									/>
									<div className="flex items-center gap-3 text-xs text-gray-600">
										<label className="inline-flex items-center gap-2">
											<input
												type="checkbox"
												checked={isDraftMode}
												onChange={(event) => setIsDraftMode(event.target.checked)}
												className="h-4 w-4 rounded border-gray-300"
											/>
											Draft
										</label>
										<label className="inline-flex items-center gap-2">
											<input
												type="checkbox"
												checked={autoDraftEnabled}
												onChange={(event) => setAutoDraftEnabled(event.target.checked)}
												className="h-4 w-4 rounded border-gray-300"
											/>
											Auto-save 3m
										</label>
									</div>
								</div>
							</header>

							<div className="grid flex-1 overflow-hidden lg:grid-cols-[280px_1fr]">
								<div className="border-r border-gray-200 overflow-y-auto p-4">
									<div className="space-y-2">
										{versions.map((versionItem) => (
											<button
												key={`history-${versionItem.id}`}
												type="button"
												onClick={() => {
													setSelectedVersion(versionItem.version);
													if (compareVersion === versionItem.version) {
														setCompareVersion(null);
													}
												}}
												className={`w-full rounded-xl border p-3 text-left transition ${
													selectedVersion === versionItem.version
														? "border-blue-200 bg-blue-50"
														: "border-gray-200 bg-gray-50 hover:border-gray-300"
												}`}
											>
												<p className="text-sm font-semibold text-gray-900">v{versionItem.version}</p>
												<p className="mt-1 text-xs text-gray-500">{new Date(versionItem.createdAt).toLocaleString("ko-KR")}</p>
												<p className="mt-1 line-clamp-2 text-xs text-gray-600">{versionItem.commitMessage || "(메시지 없음)"}</p>
											</button>
										))}
									</div>
								</div>

								<div className="overflow-y-auto p-5">
									<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
										<div>
											<p className="text-xs font-medium text-gray-500">비교 기준 버전</p>
											<select
												value={compareVersion ?? ""}
												onChange={(event) => {
													const value = Number.parseInt(event.target.value, 10);
													setCompareVersion(Number.isFinite(value) ? value : null);
												}}
												className="mt-1 h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
											>
												<option value="">없음</option>
												{versions
													.filter((item) => item.version !== selectedVersion)
													.map((item) => (
														<option key={`compare-${item.id}`} value={item.version}>
															v{item.version}
														</option>
													))}
											</select>
										</div>
										{selectedVersion ? (
											<button
												type="button"
												onClick={() => handleRestoreVersion(selectedVersion)}
												className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
											>
												이 버전으로 복원
											</button>
										) : null}
									</div>

									{isLoadingSnapshot ? (
										<p className="text-sm text-gray-500">버전 스냅샷 로딩 중...</p>
									) : (
										<div className="space-y-3">
											{diffEntries.length === 0 ? (
												<div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
													변경점이 없습니다.
												</div>
											) : (
												diffEntries.map((entry) => (
													<article key={`${entry.path}-${entry.type}`} className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
														<div className="mb-2 flex items-center justify-between gap-2">
															<p className="text-sm font-semibold text-blue-800">{entry.path}</p>
															<span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-blue-700">
																{entry.type}
															</span>
														</div>
														<div className="grid gap-2 text-xs text-gray-700 md:grid-cols-2">
															<div className="rounded-xl border border-gray-200 bg-white p-2.5">
																<p className="mb-1 text-[11px] font-semibold text-gray-500">Before</p>
																<pre className="whitespace-pre-wrap break-words font-medium">{formatDiffValue(entry.before)}</pre>
															</div>
															<div className="rounded-xl border border-gray-200 bg-white p-2.5">
																<p className="mb-1 text-[11px] font-semibold text-gray-500">After</p>
																<pre className="whitespace-pre-wrap break-words font-medium">{formatDiffValue(entry.after)}</pre>
															</div>
														</div>
													</article>
												))
											)}
										</div>
									)}
								</div>
							</div>
						</div>
					</aside>
				</div>
			) : null}
		</>
	);
}


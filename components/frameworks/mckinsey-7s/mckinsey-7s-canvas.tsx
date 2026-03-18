"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFrameworkTitleAction } from "@/features/frameworks/actions/framework-actions";
import { pushToast } from "@/lib/utils/toast";

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

type SevenSOuterKey = Exclude<keyof SevenSData, "sharedValues">;
type SevenSKey = keyof SevenSData;

type McKinsey7SCanvasProps = {
	projectId: string;
	frameworkId: string | null;
	currentVersion: number | null;
	initialData: SevenSData;
};

export function McKinsey7SCanvas({ projectId, frameworkId, currentVersion, initialData }: McKinsey7SCanvasProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [data, setData] = useState<SevenSData>(initialData);
	const [selectedNode, setSelectedNode] = useState<SevenSKey | null>(null);

	useEffect(() => {
		setData(initialData);
		setSelectedNode(null);
	}, [initialData]);

	if (!frameworkId) {
		return (
			<div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
				<p className="text-sm text-gray-600">버전이 없습니다. 상단에서 새 버전을 먼저 생성해 주세요.</p>
			</div>
		);
	}

	const validFrameworkId = frameworkId as string;

	function save() {
		startTransition(async () => {
			try {
				await updateFrameworkTitleAction(projectId, "MCKINSEY_7S", validFrameworkId, JSON.stringify(data));
				pushToast("McKinsey 7S 내용이 저장되었습니다.");
				router.refresh();
			} catch (error) {
				const message = error instanceof Error ? error.message : "저장에 실패했습니다.";
				pushToast(message, "error");
			}
		});
	}

	const outerNodes: Array<{ key: SevenSOuterKey; label: string }> = useMemo(
		() => [
			{ key: "strategy", label: "Strategy" },
			{ key: "structure", label: "Structure" },
			{ key: "systems", label: "Systems" },
			{ key: "style", label: "Style" },
			{ key: "staff", label: "Staff" },
			{ key: "skills", label: "Skills" },
		],
		[]
	);

	const nodeLayout = useMemo(
		() =>
			outerNodes.map((node, index) => {
				const angle = -150 + index * (360 / outerNodes.length);
				const radius = 34;
				const rad = (angle * Math.PI) / 180;

				return {
					...node,
					x: 50 + radius * Math.cos(rad),
					y: 50 + radius * Math.sin(rad),
				};
			}),
		[outerNodes]
	);

	const selectedNodeData = selectedNode ? data[selectedNode] : null;
	const selectedLabel = selectedNode
		? selectedNode === "sharedValues"
			? "Shared Values"
			: outerNodes.find((node) => node.key === selectedNode)?.label ?? ""
		: "";

	function getSummaryText(node: SevenSNode) {
		const text = (node.title.trim() || node.description.trim() || "내용을 입력하세요").replace(/\s+/g, " ");
		return text.length > 30 ? `${text.slice(0, 30)}...` : text;
	}

	function parseBulletPoints(text: string) {
		return text
			.split(/\n+/)
			.map((line) => line.trim())
			.filter((line) => line.length > 0)
			.map((line) => line.replace(/^[-•*]\s*/, ""));
	}

	function getLineStyle(x: number, y: number) {
		const dx = x - 50;
		const dy = y - 50;
		const length = Math.sqrt(dx * dx + dy * dy);
		const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

		return {
			left: "50%",
			top: "50%",
			width: `${length}%`,
			transform: `translateY(-50%) rotate(${angle}deg)`,
			transformOrigin: "0 50%",
		};
	}

	function getSegmentLineStyle(from: { x: number; y: number }, to: { x: number; y: number }) {
		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const length = Math.sqrt(dx * dx + dy * dy);
		const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

		return {
			left: `${from.x}%`,
			top: `${from.y}%`,
			width: `${length}%`,
			transform: `translateY(-50%) rotate(${angle}deg)`,
			transformOrigin: "0 50%",
		};
	}

	function isDimmed(nodeKey: SevenSKey) {
		if (!selectedNode) return false;
		return selectedNode !== nodeKey;
	}

	return (
		<>
			<section className="relative z-0 space-y-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
				{isPending && (
					<div className="absolute inset-0 z-30 flex items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm">
						<p className="text-sm font-medium text-gray-500">저장 중...</p>
					</div>
				)}

				<div className="text-center">
					<p className="text-sm text-gray-400">Framework · McKinsey 7S</p>
					{currentVersion ? (
						<p className="mt-2">
							<span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
								v{currentVersion}
							</span>
						</p>
					) : null}
					<h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Organizational Alignment Map</h2>
				</div>

				<div className="overflow-x-auto pb-2">
					<div className="relative mx-auto aspect-square w-full min-w-[680px] max-w-5xl">
						<div className="absolute inset-0 z-10">
							{nodeLayout.map((node) => {
								const highlighted =
									!selectedNode || selectedNode === "sharedValues" || selectedNode === node.key;

								return (
									<div
										key={`line-${node.key}`}
										className={`absolute h-px transition-all duration-200 ${
											highlighted ? "bg-gray-400/40" : "bg-gray-300/20"
										}`}
										style={getLineStyle(node.x, node.y)}
									/>
								);
							})}

							{nodeLayout.map((node, index) => {
								const nextNode = nodeLayout[(index + 1) % nodeLayout.length];
								const highlighted = !selectedNode || selectedNode === node.key || selectedNode === nextNode.key;

								return (
									<div
										key={`outer-line-${node.key}-${nextNode.key}`}
										className={`absolute h-px transition-all duration-200 ${
											highlighted ? "bg-gray-300/35" : "bg-gray-300/15"
										}`}
										style={getSegmentLineStyle(node, nextNode)}
									/>
								);
							})}
						</div>

						{nodeLayout.map((node) => {
							const selected = selectedNode === node.key;
							const dimmed = isDimmed(node.key);

							return (
								<button
									key={node.key}
									type="button"
									onClick={() => setSelectedNode(node.key)}
									className={`absolute z-10 flex h-44 w-44 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border bg-white px-5 text-center transition-all duration-200 hover:scale-[1.04] hover:shadow-md sm:h-48 sm:w-48 ${
										selected
											? "border-blue-400 shadow-md"
											: "border-gray-300 shadow-sm hover:border-gray-400"
									} ${dimmed ? "opacity-50" : "opacity-100"}`}
									style={{ left: `${node.x}%`, top: `${node.y}%` }}
								>
									<p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{node.label}</p>
									<p className="mt-2 line-clamp-2 max-w-[130px] text-xs text-gray-500">{getSummaryText(data[node.key])}</p>
								</button>
							);
						})}

						<button
							type="button"
							onClick={() => setSelectedNode("sharedValues")}
							className={`absolute left-1/2 top-1/2 z-10 flex h-60 w-60 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-4 px-7 text-center transition-all duration-200 hover:scale-[1.04] hover:shadow-md sm:h-64 sm:w-64 ${
								selectedNode === "sharedValues"
									? "border-blue-500 bg-blue-50 shadow-md"
									: "border-blue-200 bg-blue-50/70 shadow-sm"
							} ${isDimmed("sharedValues") ? "opacity-50" : "opacity-100"}`}
						>
							<p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Shared Values</p>
							<p className="mt-2 line-clamp-2 max-w-[170px] text-sm text-blue-900/80">
								{getSummaryText(data.sharedValues)}
							</p>
						</button>
					</div>
				</div>

				<div className="flex justify-end">
					<button
						type="button"
						disabled={isPending}
						onClick={save}
						className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-600 disabled:bg-blue-200"
					>
						{isPending ? "저장 중..." : "7S 저장"}
					</button>
				</div>
			</section>

			{selectedNode && selectedNodeData && (
				<>
					<button
						type="button"
						aria-label="drawer-overlay"
						className="fixed inset-0 z-20 bg-black/20"
						onClick={() => setSelectedNode(null)}
					/>
					<aside className="fixed inset-y-0 right-0 z-30 w-full max-w-md border-l border-gray-200 bg-white p-6 shadow-2xl">
						<div className="flex h-full flex-col">
							<div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
								<div>
									<p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Selected Node</p>
									<h3 className="mt-1 text-lg font-semibold text-gray-900">{selectedLabel}</h3>
								</div>
								<button
									type="button"
									onClick={() => setSelectedNode(null)}
									className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
								>
									닫기
								</button>
							</div>

							<div className="mt-5 flex-1 space-y-5 overflow-y-auto pr-1">
								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
									<input
										className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition-all focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
										value={selectedNodeData.title}
										onChange={(event) => {
											const value = event.target.value;
											setData((prev) => ({
												...prev,
												[selectedNode]: { ...prev[selectedNode], title: value },
											}));
										}}
										placeholder="짧은 제목"
									/>
								</div>

								<div>
									<label className="mb-1 block text-sm font-medium text-gray-700">Full Description</label>
									<textarea
										className="h-40 w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-800 outline-none transition-all focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
										value={selectedNodeData.description}
										onChange={(event) => {
											const value = event.target.value;
											setData((prev) => ({
												...prev,
												[selectedNode]: { ...prev[selectedNode], description: value },
											}));
										}}
										placeholder="상세 설명 및 메모를 입력하세요"
									/>
								</div>

								<div>
									<p className="mb-2 text-sm font-medium text-gray-700">Bullet Points</p>
									<ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
										{parseBulletPoints(selectedNodeData.description).length > 0 ? (
											parseBulletPoints(selectedNodeData.description).map((point, index) => (
												<li key={`${selectedNode}-point-${index}`}>{point}</li>
											))
										) : (
											<li>설명 내용을 줄 단위로 작성하면 bullet로 표시됩니다.</li>
										)}
									</ul>
								</div>
							</div>

							<div className="border-t border-gray-100 pt-4">
								<button
									type="button"
									disabled={isPending}
									onClick={save}
									className="w-full rounded-xl bg-[#3182F6] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-600 disabled:bg-blue-200"
								>
									{isPending ? "저장 중..." : "선택 항목 저장"}
								</button>
							</div>
						</div>
					</aside>
				</>
			)}
		</>
	);
}

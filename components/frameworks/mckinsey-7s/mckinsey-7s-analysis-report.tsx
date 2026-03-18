"use client";

import { useEffect, useState, useTransition } from "react";
import { Pencil, Check, X } from "lucide-react";
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

type SevenSKey = keyof SevenSData;

type ElementConfig = {
	key: SevenSKey;
	label: string;
	description: string;
	indicatorColor: string;
	bgAccent: string;
	borderColor: string;
};

type McKinsey7SAnalysisReportProps = {
	projectId: string;
	frameworkId: string | null;
	initialData: SevenSData;
};

const elements: ElementConfig[] = [
	{
		key: "strategy",
		label: "Strategy",
		description: "전략 방향 및 목표",
		indicatorColor: "before:bg-blue-500",
		bgAccent: "bg-blue-50",
		borderColor: "border-blue-100",
	},
	{
		key: "structure",
		label: "Structure",
		description: "조직 구조 및 체계",
		indicatorColor: "before:bg-purple-500",
		bgAccent: "bg-purple-50",
		borderColor: "border-purple-100",
	},
	{
		key: "systems",
		label: "Systems",
		description: "운영 시스템 및 프로세스",
		indicatorColor: "before:bg-pink-500",
		bgAccent: "bg-pink-50",
		borderColor: "border-pink-100",
	},
	{
		key: "style",
		label: "Style",
		description: "리더십 스타일 및 문화",
		indicatorColor: "before:bg-amber-500",
		bgAccent: "bg-amber-50",
		borderColor: "border-amber-100",
	},
	{
		key: "staff",
		label: "Staff",
		description: "핵심 인력 및 역할",
		indicatorColor: "before:bg-emerald-500",
		bgAccent: "bg-emerald-50",
		borderColor: "border-emerald-100",
	},
	{
		key: "skills",
		label: "Skills",
		description: "핵심 역량 및 능력",
		indicatorColor: "before:bg-cyan-500",
		bgAccent: "bg-cyan-50",
		borderColor: "border-cyan-100",
	},
	{
		key: "sharedValues",
		label: "Shared Values",
		description: "조직의 핵심 가치 및 문화",
		indicatorColor: "before:bg-red-500",
		bgAccent: "bg-red-50",
		borderColor: "border-red-100",
	},
];

export function McKinsey7SAnalysisReport({
	projectId,
	frameworkId,
	initialData,
}: McKinsey7SAnalysisReportProps) {
	const [isPending, startTransition] = useTransition();
	const [data, setData] = useState<SevenSData>(initialData);
	const [editingKey, setEditingKey] = useState<SevenSKey | null>(null);
	const [editingTitle, setEditingTitle] = useState("");
	const [editingDescription, setEditingDescription] = useState("");

	useEffect(() => {
		setData(initialData);
	}, [initialData]);

	if (!frameworkId) {
		return (
			<div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
				<p className="text-sm text-gray-600">
					버전이 없습니다. 상단에서 새 버전을 먼저 생성해 주세요.
				</p>
			</div>
		);
	}

	function save() {
		startTransition(async () => {
			try {
				await updateFrameworkTitleAction(
					projectId,
					"MCKINSEY_7S",
					frameworkId as string,
					JSON.stringify(data)
				);
				pushToast("McKinsey 7S 내용이 저장되었습니다.");
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "저장에 실패했습니다.";
				pushToast(message, "error");
			}
		});
	}

	function startEdit(key: SevenSKey) {
		setEditingKey(key);
		setEditingTitle(data[key].title);
		setEditingDescription(data[key].description);
	}

	function handleUpdate() {
		if (!editingKey) return;

		const updated = {
			...data,
			[editingKey]: {
				title: editingTitle.trim(),
				description: editingDescription.trim(),
			},
		};
		setData(updated);
		setEditingKey(null);
		setEditingTitle("");
		setEditingDescription("");
	}

	function handleCancel() {
		setEditingKey(null);
		setEditingTitle("");
		setEditingDescription("");
	}

	return (
		<div className="mx-auto max-w-6xl">
			{/* Header */}
			<div className="mb-12 space-y-2">
				<h1 className="text-4xl font-bold tracking-tight text-gray-900">
					McKinsey 7S
				</h1>
				<p className="text-lg text-gray-500">
					Organizational alignment framework analyzing strategy, structure, systems,
					style, staff, skills, and shared values
				</p>
				{isPending ? <p className="text-sm text-gray-400">저장 중...</p> : null}
			</div>

			{/* Elements Grid */}
			<div className="space-y-6 print:space-y-4">
				{elements.map((element) => {
					const nodeData = data[element.key];
					const isEditing = editingKey === element.key;

					return (
						<div
							key={element.key}
							className={`relative rounded-3xl border ${element.borderColor} ${element.bgAccent} p-8 shadow-sm transition-all print:shadow-none print:p-6 hover:shadow-md print:hover:shadow-none before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-3xl ${element.indicatorColor} print:before:w-0.5`}
						>
							{/* Content grid: 250px title | 1fr analysis */}
							<div
								className="grid gap-10 print:gap-6"
								style={{ gridTemplateColumns: "250px 1fr" }}
							>
								{/* Left: Category title & summary */}
								<div className="flex flex-col justify-between print:justify-start">
									<div className="space-y-2">
										<h2 className="text-2xl font-bold text-gray-900 print:text-xl">
											{element.label}
										</h2>
										<p className="text-sm text-gray-600 print:text-xs">
											{element.description}
										</p>
									</div>
								</div>

								{/* Right: Detailed content */}
								<div className="space-y-4">
									{isEditing ? (
										<>
											<div className="space-y-2">
												<label className="block text-sm font-medium text-gray-700">
													제목
												</label>
												<input
													type="text"
													value={editingTitle}
													onChange={(e) => setEditingTitle(e.target.value)}
													className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
													placeholder="제목 입력"
												/>
											</div>
											<div className="space-y-2">
												<label className="block text-sm font-medium text-gray-700">
													설명
												</label>
												<textarea
													value={editingDescription}
													onChange={(e) =>
														setEditingDescription(e.target.value)
													}
													rows={4}
													className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
													placeholder="상세 설명 입력"
												/>
											</div>
											<div className="flex items-center justify-end gap-2">
												<button
													type="button"
													onClick={handleUpdate}
													disabled={isPending}
													className="inline-flex items-center gap-1 rounded-md bg-[#3182F6] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 print:hidden"
												>
													<Check className="h-3.5 w-3.5" /> 저장
												</button>
												<button
													type="button"
													onClick={handleCancel}
													className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 print:hidden"
												>
													<X className="h-3.5 w-3.5" /> 취소
												</button>
											</div>
										</>
									) : (
										<div className="flex items-start justify-between gap-3">
											<div className="space-y-2 flex-1">
												{nodeData.title && (
													<p className="text-base font-semibold text-gray-900 print:text-sm">
														{nodeData.title}
													</p>
												)}
												<p className="text-sm text-gray-700 whitespace-pre-wrap print:text-xs">
													{nodeData.description || "내용을 입력해주세요"}
												</p>
											</div>
											<button
												type="button"
												onClick={() => startEdit(element.key)}
												className="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 print:hidden"
												aria-label={`${element.label} 편집`}
											>
												<Pencil className="h-3.5 w-3.5" />
											</button>
										</div>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Save Button */}
			<div className="mt-8 flex justify-end print:hidden">
				<button
					type="button"
					disabled={isPending}
					onClick={save}
					className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-600 disabled:bg-blue-200"
				>
					{isPending ? "저장 중..." : "7S 저장"}
				</button>
			</div>
		</div>
	);
}

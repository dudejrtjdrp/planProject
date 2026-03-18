export default function Loading() {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-6xl px-6 py-8">
				<div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
				<div className="mt-6 h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
				<div className="mt-4 h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
			</div>
		</div>
	);
}


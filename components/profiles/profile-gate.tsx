"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CURRENT_USER_KEY } from "@/lib/config/profile-storage";

type ProfileGateProps = {
	children: ReactNode;
};

export function ProfileGate({ children }: ProfileGateProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isChecking, setIsChecking] = useState(true);
	const [hasProfile, setHasProfile] = useState(false);

	useEffect(() => {
		const currentUser = window.localStorage.getItem(CURRENT_USER_KEY);

		if (currentUser) {
			setHasProfile(true);
			setIsChecking(false);
			return;
		}

		const query = searchParams.toString();
		const nextPath = `${pathname}${query ? `?${query}` : ""}`;
		router.replace(`/profile?next=${encodeURIComponent(nextPath)}`);
		setHasProfile(false);
		setIsChecking(false);
	}, [pathname, router, searchParams]);

	if (isChecking) {
		return (
			<div className="min-h-screen bg-[#F9FAFB]">
				<div className="mx-auto max-w-5xl p-8">
					<div className="h-8 w-52 animate-pulse rounded bg-gray-200" />
					<div className="mt-6 h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
				</div>
			</div>
		);
	}

	if (!hasProfile) {
		return null;
	}

	return <>{children}</>;
}


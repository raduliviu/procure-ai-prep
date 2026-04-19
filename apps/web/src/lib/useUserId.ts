import { useCallback, useState } from "react";
import type { UserRole } from "@procure/shared";
import { APPROVER_ID, REQUESTER_ID } from "./users";

const STORAGE_KEY = "x-user-id";

function readUserId(): string | null {
	return window.localStorage.getItem(STORAGE_KEY);
}

/**
 * React-stateful accessor for the mock-auth user id.
 *
 * Reads from localStorage on mount and writes through on every change so
 * the apiClient (which also reads from localStorage) stays in sync with
 * what the UI is showing.
 */
export function useUserId() {
	const [userId, setUserId] = useState<string | null>(readUserId);

	const setUserIdPersisted = useCallback((id: string | null) => {
		if (id === null) {
			window.localStorage.removeItem(STORAGE_KEY);
		} else {
			window.localStorage.setItem(STORAGE_KEY, id);
		}
		setUserId(id);
	}, []);

	return [userId, setUserIdPersisted] as const;
}

/**
 * Derives the current role from the user id stored in localStorage.
 * Returns `null` if no role has been selected yet (the Header buttons
 * have not been clicked).
 */
export function useRole(): UserRole | null {
	const [userId] = useUserId();
	if (userId === REQUESTER_ID) return "requester";
	if (userId === APPROVER_ID) return "approver";
	return null;
}

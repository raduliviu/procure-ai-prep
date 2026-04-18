import { useCallback, useState } from "react";

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

import {
	type PropsWithChildren,
	createContext,
	useCallback,
	useContext,
	useMemo,
} from "react";
import type { NostrEvent } from "nostr-tools";

import { useLocalSettings } from "~/providers/global/preferences";

export type Thread = {
	root?: NostrEvent;
	rootId: string;
	messages: NostrEvent[];
};
type ThreadsContextType = {
	threads: Record<string, Thread>;
	getRoot: (id: string) => NostrEvent | undefined;
};
const ThreadsContext = createContext<ThreadsContextType>({
	threads: {},
	getRoot: (id: string) => {
		return undefined;
	},
});

export function useThreadsContext() {
	return useContext(ThreadsContext);
}

export default function ThreadsProvider({
	messages,
	children,
}: { messages: NostrEvent[] } & PropsWithChildren) {
	const { eventStoreManagement } = useLocalSettings();

	const threads = useMemo(() => {
		const grouped: Record<string, Thread> = {};
		for (const message of messages) {
			const rootId = message.tags.find(
				(t) => t[0] === "e" && t[3] === "root",
			)?.[1];
			if (rootId) {
				if (!grouped[rootId]) {
					grouped[rootId] = {
						messages: [],
						rootId,
						root: eventStoreManagement.eventStore.getEvent(rootId),
					};
				}
				grouped[rootId].messages.push(message);
			}
		}
		return grouped;
	}, [messages.length]);

	const getRoot = useCallback((id: string) => {
		return eventStoreManagement.eventStore.getEvent(id);
	}, []);

	const context = useMemo(() => ({ threads, getRoot }), [threads, getRoot]);

	return (
		<ThreadsContext.Provider value={context}>
			{children}
		</ThreadsContext.Provider>
	);
}

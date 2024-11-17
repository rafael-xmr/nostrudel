import { useCallback, useMemo } from "react";

import type { NostrEvent } from "../types/nostr-event";
import useAppSettings from "./use-app-settings";
import type { Kind0ParsedContent } from "../helpers/nostr/user-metadata";

export default function useWordMuteFilter() {
	const { mutedWords } = useAppSettings();

	const regexp = useMemo(() => {
		if (!mutedWords) return;
		const words = mutedWords
			.split(/[,\n]/g)
			.map((s) => s.trim())
			.filter(Boolean);
		return new RegExp(`(?:^|\\s|#)(?:${words.join("|")})(?:\\s|$)`, "i");
	}, [mutedWords]);

	return useCallback(
		(event: NostrEvent, _userMetadata?: Kind0ParsedContent) => {
			if (!regexp) return false;
			return event.content.match(regexp) !== null;
		},
		[regexp],
	);
}

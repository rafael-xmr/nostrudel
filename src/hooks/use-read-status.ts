import { useCallback, useMemo } from "react";
import { useObservable } from "applesauce-react/hooks";
import { useReadStatusProvider } from "~/providers/global/read-status-provider";

export default function useReadStatus(key: string, ttl?: number) {
	const readStatusService = useReadStatusProvider();
	const subject = useMemo(
		() => readStatusService?.getStatus(key, ttl),
		[readStatusService, key],
	);

	const setRead = useCallback(
		(read = true) => readStatusService?.setRead(key, read, ttl),
		[readStatusService, key, ttl],
	);

	const read = useObservable(subject);

	return [read, setRead] as const;
}

import { useEffect, useMemo } from "react";
import { useLocalSettings } from "~/providers/global/preferences";
import useForceUpdate from "./use-force-update";

export default function useEventUpdate(id?: string) {
	const update = useForceUpdate();
	const { eventStoreManagement } = useLocalSettings();

	const observable = useMemo(
		() => (id ? eventStoreManagement.eventStore.updated(id) : undefined),
		[id, eventStoreManagement],
	);
	useEffect(() => {
		if (!observable) return;
		const sub = observable.subscribe(update);
		return () => sub.unsubscribe();
	}, [observable, update]);
}

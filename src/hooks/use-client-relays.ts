import { useObservableEagerState } from "applesauce-react/hooks";
import { unique } from "../helpers/array";
import { useLocalSettings } from "~/providers/global/preferences";

export function useReadRelays(additional?: Iterable<string>) {
	const { localSettings } = useLocalSettings();
	const relays = useObservableEagerState(localSettings.readRelays);
	if (additional) return unique([...relays, ...additional]);
	else return relays;
}
export function useWriteRelays(additional?: Iterable<string>) {
	const { localSettings } = useLocalSettings();
	const relays = useObservableEagerState(localSettings.writeRelays);
	if (additional) return unique([...relays, ...additional]);
	else return relays;
}

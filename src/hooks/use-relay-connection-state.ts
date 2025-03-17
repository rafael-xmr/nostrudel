import { useObservable } from "applesauce-react/hooks";
import { connections$ } from "~/providers/global/rx-nostr-provider";

export default function useRelayConnectionState(relay: string) {
	const connections = useObservable(connections$);
	return connections[relay];
}

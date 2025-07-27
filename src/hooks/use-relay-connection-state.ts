import { useObservableState } from "applesauce-react/hooks";
import { useLocalSettings } from "~/providers/global/preferences";

export default function useRelayConnectionState(relay: string) {
	const { relayPoolManagement } = useLocalSettings();
	const connections = useObservableState(relayPoolManagement.connections$);
	return connections?.[relay] ?? "dormant";
}

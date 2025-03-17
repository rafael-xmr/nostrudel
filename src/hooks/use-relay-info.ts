import { useAsync } from "react-use";
import { useRelayInfoProvider } from "~/providers/global/relay-info-provider";

export function useRelayInfo(relay?: string, alwaysFetch = false) {
	const relayInfoService = useRelayInfoProvider();
	const {
		value: info,
		loading,
		error,
	} = useAsync(async () => {
		if (relay) return await relayInfoService?.getInfo(relay, alwaysFetch);
		return undefined;
	}, [relay]);

	return { info, loading, error };
}

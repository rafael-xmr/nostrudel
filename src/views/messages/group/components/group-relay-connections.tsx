import { Button, type ButtonProps } from "@chakra-ui/react";
import {
	useActiveAccount,
	useEventModel,
	useObservableState,
} from "applesauce-react/hooks";
import { useMemo } from "react";

import { RelayIcon } from "../../../../components/icons";
import { DirectMessageRelays } from "../../../../models/messages";
import { useLocalSettings } from "~/providers/global/preferences";

export default function GroupRelayConnectionsButton({
	group,
	...props
}: Omit<ButtonProps, "children" | "colorScheme"> & { group: string }) {
	const account = useActiveAccount()!;
	const { relayPoolManagement, eventStoreManagement, loadersManagement } =
		useLocalSettings();
	const relays = useEventModel(DirectMessageRelays, [
		account.pubkey,
		eventStoreManagement,
		loadersManagement,
	]);
	const connections =
		useObservableState(relayPoolManagement.connections$) ?? {};

	const color = useMemo(() => {
		if (!relays) return "red";
		for (const url of relays) {
			if (connections[url] !== "connected") return "yellow";
		}
		return "green";
	}, [relays, connections]);

	const connected = useMemo(
		() =>
			relays?.reduce(
				(acc, relay) => acc + (connections[relay] === "connected" ? 1 : 0),
				0,
			) ?? 0,
		[relays, connections],
	);

	return (
		<Button colorScheme={color} leftIcon={<RelayIcon />} {...props}>
			{connected} / {relays?.length ?? NaN}
		</Button>
	);
}

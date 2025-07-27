import { Badge, type BadgeProps } from "@chakra-ui/react";
import { useObservableState } from "applesauce-react/hooks";

import { getConnectionStateColor } from "../../helpers/relay";
import { useLocalSettings } from "~/providers/global/preferences";

export default function RelayStatusBadge({
	relay,
	...props
}: { relay: string } & Omit<BadgeProps, "colorScheme" | "children">) {
	const { relayPoolManagement } = useLocalSettings();
	const connections =
		useObservableState(relayPoolManagement.connections$) ?? {};
	const state = connections[relay];

	return (
		<Badge colorScheme={getConnectionStateColor(state)} {...props}>
			{state}
		</Badge>
	);
}

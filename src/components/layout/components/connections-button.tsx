import { Button, type ButtonProps } from "@chakra-ui/react";
import { useObservableState } from "applesauce-react/hooks";

import { useLocalSettings } from "~/providers/global/preferences";
import { useTaskManagerContext } from "../../../views/task-manager/provider";

export default function RelayConnectionButton({
	...props
}: Omit<ButtonProps, "children" | "onClick">) {
	const { openTaskManager } = useTaskManagerContext();
	const { relayPoolManagement } = useLocalSettings();

	const connections =
		useObservableState(relayPoolManagement.connections$) ?? {};
	const connected = Object.values(connections).reduce(
		(t, s) => (s === "connected" ? t + 1 : t),
		0,
	);

	return (
		<Button onClick={() => openTaskManager("/relays")} {...props}>
			Relays ({connected})
		</Button>
	);
}

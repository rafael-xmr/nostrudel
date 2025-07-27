import { CloseButton, Code, Flex, Text } from "@chakra-ui/react";
import type { NostrEvent } from "nostr-tools";

import useEventUpdate from "../../../hooks/use-event-update";
import { useLocalSettings } from "~/providers/global/preferences";

export default function DebugEventCachePage({ event }: { event: NostrEvent }) {
	const { eventStoreManagement } = useLocalSettings();

	useEventUpdate(event.id);
	const fields = Object.getOwnPropertySymbols(event);
	const update = () => eventStoreManagement.eventStore.update(event);

	const renderValue = (field: symbol) => {
		const value = Reflect.get(event, field);

		if (value instanceof Map)
			return JSON.stringify(Object.fromEntries(value.entries()));
		if (value instanceof Set) return JSON.stringify(Array.from(value));

		return JSON.stringify(value);
	};

	return (
		<Flex direction="column">
			{fields.map((field) => (
				<Flex gap="2" alignItems="center" key={field.description}>
					<Text fontWeight="bold" whiteSpace="pre">
						{field.description}
					</Text>
					<Code fontFamily="monospace" isTruncated>
						{renderValue(field)}
					</Code>
					<CloseButton
						ml="auto"
						onClick={() => {
							Reflect.deleteProperty(event, field);
							update();
						}}
					/>
				</Flex>
			))}
		</Flex>
	);
}

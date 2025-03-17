import { useState } from "react";
import {
	addEvents,
	countEvents,
	countEventsByKind,
	getEventUID,
	updateUsed,
} from "nostr-idb";
import {
	Button,
	ButtonGroup,
	Card,
	Flex,
	FormControl,
	FormLabel,
	Heading,
	NumberDecrementStepper,
	NumberIncrementStepper,
	NumberInput,
	NumberInputField,
	NumberInputStepper,
	Text,
} from "@chakra-ui/react";
import { useAsync } from "react-use";
import type { NostrEvent } from "nostr-tools";
import { useObservable } from "applesauce-react/hooks";

import { localDatabase } from "../../../../services/cache-relay";
import EventKindsPieChart from "../../../../components/charts/event-kinds-pie-chart";
import EventKindsTable from "../../../../components/charts/event-kinds-table";
import ImportEventsButton from "./components/import-events-button";
import ExportEventsButton from "./components/export-events-button";
import localSettings from "../../../../services/local-settings";
import { useDB } from "~/providers/global/db-provider";

async function importEvents(events: NostrEvent[]) {
	if (!localDatabase) return;

	await addEvents(localDatabase, events);
	await updateUsed(
		localDatabase,
		events.map((e) => getEventUID(e)),
	);
}
async function exportEvents() {
	if (!localDatabase) return;
	return (await localDatabase.getAll("events")).map((row) => row.event);
}

export default function InternalDatabasePage() {
	const db = useDB();

	const { value: count } = useAsync(
		async () => await countEvents(localDatabase),
		[],
	);
	const { value: kinds } = useAsync(
		async () => await countEventsByKind(localDatabase),
		[],
	);

	const maxEvents = useObservable(localSettings.idbMaxEvents);

	const [clearing, setClearing] = useState(false);
	const handleClearData = async () => {
		setClearing(true);
		await db.clearCacheData();
		setClearing(false);
	};

	const [deleting, setDeleting] = useState(false);
	const handleDeleteDatabase = async () => {
		setDeleting(true);
		await db.deleteDatabase();
		setDeleting(false);
	};

	return (
		<>
			<Text>Total events: {count ?? "Loading..."}</Text>
			<ButtonGroup flexWrap="wrap">
				<ImportEventsButton onLoad={importEvents} />
				<ExportEventsButton getEvents={exportEvents} />
			</ButtonGroup>
			<ButtonGroup flexWrap="wrap">
				<Button
					onClick={handleClearData}
					isLoading={clearing}
					colorScheme="primary"
					variant="outline"
				>
					Clear cache
				</Button>
				<Button
					colorScheme="red"
					onClick={handleDeleteDatabase}
					isLoading={deleting}
				>
					Delete database
				</Button>
			</ButtonGroup>
			<FormControl>
				<FormLabel>Maximum number of events</FormLabel>
				<NumberInput
					maxW="xs"
					value={maxEvents}
					onChange={(s, v) => {
						if (Number.isFinite(v)) localSettings.idbMaxEvents.next(v);
						else localSettings.idbMaxEvents.clear();
					}}
					step={1000}
				>
					<NumberInputField />
					<NumberInputStepper>
						<NumberIncrementStepper />
						<NumberDecrementStepper />
					</NumberInputStepper>
				</NumberInput>
			</FormControl>
			<Flex gap="2" wrap="wrap" alignItems="flex-start" w="full">
				{kinds && (
					<>
						<Card p="2" minW="sm" maxW="lg" flex={1}>
							<Heading size="sm">Events by kind</Heading>
							<EventKindsPieChart kinds={kinds} />
						</Card>
						<Card p="2" minW="sm" maxW="md" flex={1}>
							<EventKindsTable kinds={kinds} />
						</Card>
					</>
				)}
			</Flex>
		</>
	);
}

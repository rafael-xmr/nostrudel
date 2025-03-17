import useUserProfile from "../../hooks/use-user-profile";
import { getDisplayName } from "../../helpers/nostr/profile";
import { useAppTitle } from "../../hooks/use-app-title";
import { useReadRelays } from "../../hooks/use-client-relays";
import { AdditionalRelayProvider } from "../../providers/local/additional-relay-context";
import { unique } from "../../helpers/array";
import useParamsProfilePointer from "../../hooks/use-params-pubkey-pointer";
import useUserMailboxes from "../../hooks/use-user-mailboxes";
import SimpleParentView from "../../components/layout/presets/simple-parent-view";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import Header from "./components/header";
import { useMatches, useNavigate } from "react-router-dom";
import { useRelayScoreboard } from "~/providers/global/relay-scoreboard-provider";

const tabs = [
	{ label: "About", path: "about" },
	{ label: "Notes", path: "notes" },
	{ label: "Articles", path: "articles" },
	{ label: "Streams", path: "streams" },
	{ label: "Media", path: "media" },
	{ label: "Zaps", path: "zaps" },
	{ label: "Lists", path: "lists" },
	{ label: "Following", path: "following" },
	{ label: "Reactions", path: "reactions" },
	{ label: "Relays", path: "relays" },
	{ label: "Goals", path: "goals" },
	{ label: "Tracks", path: "tracks" },
	{ label: "Videos", path: "videos" },
	{ label: "Files", path: "files" },
	{ label: "Emojis", path: "emojis" },
	{ label: "Torrents", path: "torrents" },
	{ label: "Reports", path: "reports" },
	{ label: "Followers", path: "followers" },
	{ label: "Muted by", path: "muted-by" },
];

function useUserBestOutbox(pubkey: string, count = 4) {
	const relayScoreboardService = useRelayScoreboard();
	const mailbox = useUserMailboxes(pubkey);
	const relays = useReadRelays();
	const sorted = relayScoreboardService?.getRankedRelays(
		mailbox?.outboxes.length ? mailbox?.outboxes : relays,
	);
	return !count ? sorted : sorted?.slice(0, count);
}

export default function UserView() {
	const { pubkey, relays: pointerRelays = [] } = useParamsProfilePointer();
	const userTopRelays = useUserBestOutbox(pubkey, 4);
	const readRelays = unique([...(userTopRelays ?? []), ...pointerRelays]);

	const metadata = useUserProfile(pubkey, userTopRelays, true);
	useAppTitle(getDisplayName(metadata, pubkey));

	const navigate = useNavigate();

	const matches = useMatches();
	const lastMatch = matches[matches.length - 1];

	const activeTab = tabs.indexOf(
		tabs.find((t) => lastMatch.pathname.endsWith(t.path)) ?? tabs[0],
	);

	return (
		<AdditionalRelayProvider relays={readRelays}>
			<Header pubkey={pubkey} />
			<Tabs
				display="flex"
				flexDirection="column"
				flexGrow="1"
				isLazy
				index={activeTab}
				onChange={(v) => navigate(tabs[v].path, { replace: true })}
				colorScheme="primary"
				h="full"
			>
				<TabList overflowX="auto" overflowY="hidden" flexShrink={0}>
					{tabs.map(({ label }) => (
						<Tab key={label} whiteSpace="pre">
							{label}
						</Tab>
					))}
				</TabList>

				<TabPanels>
					{tabs.map(({ label }) => (
						<TabPanel key={label} p={0}>
							<SimpleParentView path="/u/:pubkey" context={{ pubkey }} />
						</TabPanel>
					))}
				</TabPanels>
			</Tabs>
		</AdditionalRelayProvider>
	);
}

import {
	Alert,
	AlertIcon,
	Button,
	CloseButton,
	Flex,
	Heading,
	Input,
	Text,
	useInterval,
} from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import NostrWebRtcBroker from "../../../classes/webrtc/nostr-webrtc-broker";
import SimpleView from "../../../components/layout/presets/simple-view";
import QRCodeScannerButton from "../../../components/qr-code/qr-code-scanner-button";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import useForceUpdate from "../../../hooks/use-force-update";
import { useLocalSettings } from "~/providers/global/preferences";

export default function WebRtcConnectView() {
	const update = useForceUpdate();
	const { localSettings, webRtcRelayManagement } = useLocalSettings();
	useInterval(update, 1000);

	useEffect(() => {
		webRtcRelayManagement.broker.on("call", update);
		return () => {
			webRtcRelayManagement.broker.off("call", update);
		};
	}, [update]);

	const { register, handleSubmit, formState, reset, setValue } = useForm({
		defaultValues: {
			uri: "",
		},
		mode: "all",
	});

	const connect = handleSubmit(async (values) => {
		webRtcRelayManagement.connect(values.uri);
		localSettings.webRtcRecentConnections.next([
			...localSettings.webRtcRecentConnections.value,
			values.uri,
		]);
		reset();
	});

	const recent = useObservableEagerState(localSettings.webRtcRecentConnections)
		.map((uri) => ({ ...NostrWebRtcBroker.parseNostrWebRtcURI(uri), uri }))
		.filter(({ pubkey }) => !webRtcRelayManagement.broker.peers.has(pubkey));

	return (
		<SimpleView title="Connect to WebRTC Relay">
			<Text fontStyle="italic" mt="-2">
				Scan or paste the WebRTC Connection URI of the relay you wish to connect
				to
			</Text>

			<Flex as="form" gap="2" onSubmit={connect}>
				<Input
					placeholder="webrtc+nostr:npub1..."
					{...register("uri")}
					autoComplete="off"
				/>
				<QRCodeScannerButton onResult={(data) => setValue("uri", data)} />
				<Button
					colorScheme="primary"
					type="submit"
					isLoading={formState.isSubmitting}
				>
					Connect
				</Button>
			</Flex>

			{recent.length > 0 && (
				<>
					<Heading size="md" mt="2">
						Recent Peers:
					</Heading>
					{recent.map(({ pubkey, uri }) => (
						<Flex
							key={pubkey}
							borderWidth="1px"
							rounded="md"
							p="2"
							alignItems="center"
							gap="2"
						>
							<UserAvatar pubkey={pubkey} size="sm" />
							<UserName pubkey={pubkey} />
							<Button
								size="sm"
								ml="auto"
								colorScheme="primary"
								onClick={() => {
									webRtcRelayManagement.connect(uri);
									update();
								}}
							>
								Connect
							</Button>
							<CloseButton
								onClick={() =>
									localSettings.webRtcRecentConnections.next(
										localSettings.webRtcRecentConnections.value.filter(
											(u) => u !== uri,
										),
									)
								}
							/>
						</Flex>
					))}
				</>
			)}

			<Heading size="md" mt="4">
				Pending Connection Requests:
			</Heading>
			{webRtcRelayManagement.service.pendingOutgoing.length > 0 ? (
				webRtcRelayManagement.service.pendingOutgoing.map(({ call, peer }) => (
					<Flex
						key={call.id}
						borderWidth="1px"
						rounded="md"
						p="2"
						alignItems="center"
						gap="2"
					>
						{peer.peer && (
							<>
								<UserAvatar pubkey={peer.peer} size="sm" />
								<UserName pubkey={peer.peer} />
							</>
						)}
						<Text>{peer.connection.connectionState}</Text>
					</Flex>
				))
			) : (
				<Alert status="info">
					<AlertIcon />
					No connections requests
				</Alert>
			)}
		</SimpleView>
	);
}

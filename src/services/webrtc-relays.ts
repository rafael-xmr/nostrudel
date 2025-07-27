import { type NostrEvent, SimplePool, type VerifiedEvent } from "nostr-tools";
import type { AbstractRelay } from "nostr-tools/abstract-relay";
import { SimpleSigner } from "applesauce-signers";
import { BehaviorSubject, map, distinctUntilChanged } from "rxjs";

import { logger } from "~/helpers/debug";
import NostrWebRtcBroker from "~/classes/webrtc/nostr-webrtc-broker";
import WebRtcRelayClient from "~/classes/webrtc/webrtc-relay-client";
import WebRtcRelayServer from "~/classes/webrtc/webrtc-relay-server";
import type NostrWebRTCPeer from "~/classes/webrtc/nostr-webrtc-peer";
import type { PreferenceSubject } from "~/classes/preference-subject";
import { DEFAULT_ICE_SERVERS } from "~/const";
import type { Observable } from "react-use/lib/useObservable";

export interface WebRtcCall {
	call: NostrEvent;
	peer: NostrWebRTCPeer;
	pubkey: string;
}

export interface WebRtcPendingCall {
	call: NostrEvent;
	peer: NostrWebRTCPeer;
}

export interface WebRtcRelayManagement {
	broker: NostrWebRtcBroker;
	service: WebRtcRelaysService;
	calls$: Observable<NostrEvent[]>;
	answered$: Observable<WebRtcCall[]>;
	pendingOutgoing$: Observable<WebRtcPendingCall[]>;
	pendingIncoming$: Observable<NostrEvent[]>;
	relays$: Observable<WebRtcRelayClient[]>;
	connect: (uri: string) => Promise<void>;
	acceptCall: (event: NostrEvent) => Promise<void>;
	start: () => void;
	stop: () => void;
}

export class WebRtcRelaysService {
	log = logger.extend("NostrWebRtcBroker");
	broker: NostrWebRtcBroker;
	pubkey?: string;
	upstream: AbstractRelay | null;

	approved: string[] = [];

	calls$ = new BehaviorSubject<NostrEvent[]>([]);
	get calls() {
		return this.calls$.value;
	}

	get answered() {
		const answered: WebRtcCall[] = [];
		for (const call of this.calls) {
			const peer = this.broker.peers.get(call.pubkey);
			if (peer?.peer && peer.connection.connectionState !== "new") {
				answered.push({ call, peer, pubkey: peer.peer });
			}
		}
		return answered;
	}

	get pendingOutgoing() {
		const pending: WebRtcPendingCall[] = [];
		for (const call of this.calls) {
			const pubkey = call.tags.find((t) => t[0] === "p" && t[1])?.[1];
			if (!pubkey) continue;
			const peer = this.broker.peers.get(pubkey);
			if (peer && peer.connection.connectionState === "new")
				pending.push({ call, peer });
		}
		return pending;
	}

	get pendingIncoming() {
		return this.calls.filter(
			(event) =>
				event.pubkey !== this.pubkey &&
				this.broker.peers.has(event.pubkey) === false,
		);
	}

	clients = new Map<string, WebRtcRelayClient>();
	servers = new Map<string, WebRtcRelayServer>();

	get relays() {
		return Array.from(this.clients.values());
	}

	constructor(
		broker: NostrWebRtcBroker,
		upstream: AbstractRelay | null,
		private verifyEvent: (event: NostrEvent) => event is VerifiedEvent,
	) {
		this.upstream = upstream;
		this.broker = broker;

		this.getPubkey();
	}

	private async getPubkey() {
		const pubkey = await this.broker.signer.getPublicKey();
		this.pubkey = pubkey;
	}

	async handleCall(event: NostrEvent) {
		const currentCalls = this.calls$.value;
		if (!currentCalls.includes(event)) {
			this.log(`Received call from ${event.pubkey}`);
			this.calls$.next([...currentCalls, event]);
		}

		if (this.approved.includes(event.pubkey)) {
			this.log(`Answering call from ${event.pubkey}`);
			const peer = await this.broker.answerCall(event);
			if (!peer.peer) return;

			if (this.upstream) {
				const server = new WebRtcRelayServer(peer, this.upstream);
				this.servers.set(peer.peer, server);
			}

			const client = new WebRtcRelayClient(peer, {
				websocketImplementation: WebSocket,
				verifyEvent: this.verifyEvent,
			});
			this.clients.set(peer.peer, client);
		}
	}

	async acceptCall(event: NostrEvent) {
		this.log(`Approving calls from ${event.pubkey}`);
		this.approved.push(event.pubkey);
		await this.handleCall(event);
	}

	async connect(uri: string) {
		this.log(`Connecting to ${uri}`);
		const peer = await this.broker.requestConnection(uri);
		if (!peer.peer) return;

		// add to the list of calls
		if (peer.offerEvent) {
			const currentCalls = this.calls$.value;
			this.calls$.next([...currentCalls, peer.offerEvent]);
		}

		if (this.upstream) {
			const server = new WebRtcRelayServer(peer, this.upstream);
			this.servers.set(peer.peer, server);
		}

		const client = new WebRtcRelayClient(peer, {
			websocketImplementation: WebSocket,
			verifyEvent: this.verifyEvent,
		});
		this.clients.set(peer.peer, client);
		await client.connect();
	}

	start() {
		this.broker.listenForCalls();
		this.broker.on("call", this.handleCall, this);
	}

	stop() {
		this.broker.stopListening();
		this.broker.off("call", this.handleCall, this);
	}
}

export default function createWebRtcRelayManagement(
	webRtcLocalIdentity: PreferenceSubject<Uint8Array>,
	webRtcSignalingRelays: PreferenceSubject<string[]>,
	webRtcRecentConnections: PreferenceSubject<string[]>,
	verifyEvent: (event: NostrEvent) => event is VerifiedEvent,
): WebRtcRelayManagement {
	const log = logger.extend("WebRtcRelayManagement");

	// Create signer from local identity
	const signer = new SimpleSigner(webRtcLocalIdentity.value);

	// Create broker with signaling relays
	const broker = new NostrWebRtcBroker(
		signer,
		new SimplePool(),
		webRtcSignalingRelays.value,
	);
	broker.iceServers = DEFAULT_ICE_SERVERS;

	// Create service
	const service = new WebRtcRelaysService(broker, null, verifyEvent);

	// Update broker signaling relays when preference changes
	webRtcSignalingRelays.subscribe((relays) => {
		// Update broker's signaling relays
		// Note: This might require broker restart depending on implementation
		log("Updating signaling relays", relays);
		// broker.signalingRelays = relays; // Assuming this property exists
	});

	// Update signer when identity changes
	webRtcLocalIdentity.subscribe((_identity) => {
		log("WebRTC identity changed");
		// Note: This might require recreating the signer and broker
		// depending on the implementation
	});

	// Create observables for reactive state
	const calls$ = service.calls$.asObservable();

	const answered$ = calls$.pipe(
		map(() => service.answered),
		distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
	);

	const pendingOutgoing$ = calls$.pipe(
		map(() => service.pendingOutgoing),
		distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
	);

	const pendingIncoming$ = calls$.pipe(
		map(() => service.pendingIncoming),
		distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
	);

	const relays$ = calls$.pipe(
		map(() => service.relays),
		distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
	);

	// Enhanced connect function that updates recent connections
	const connect = async (uri: string) => {
		try {
			await service.connect(uri);

			// Add to recent connections
			const recent = webRtcRecentConnections.value;
			const updated = [uri, ...recent.filter((r) => r !== uri)].slice(0, 10); // Keep last 10
			webRtcRecentConnections.next(updated);

			log(`Connected to ${uri}`);
		} catch (error) {
			log(`Failed to connect to ${uri}:`, error);
			throw error;
		}
	};

	const acceptCall = async (event: NostrEvent) => {
		try {
			await service.acceptCall(event);

			// Add caller to recent connections
			const recent = webRtcRecentConnections.value;
			const callerPubkey = event.pubkey;
			const updated = [
				callerPubkey,
				...recent.filter((r) => r !== callerPubkey),
			].slice(0, 10);
			webRtcRecentConnections.next(updated);

			log(`Accepted call from ${event.pubkey}`);
		} catch (error) {
			log(`Failed to accept call from ${event.pubkey}:`, error);
			throw error;
		}
	};

	return {
		broker,
		service,
		calls$,
		answered$,
		pendingOutgoing$,
		pendingIncoming$,
		relays$,
		connect,
		acceptCall,
		start: () => service.start(),
		stop: () => service.stop(),
	};
}

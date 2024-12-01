import { NostrEvent } from "nostr-tools";
import { BehaviorSubject } from "rxjs";

import { RelayMode } from "../classes/relay";
import { logger } from "../helpers/debug";
import RelaySet from "../classes/relay-set";
import { safeRelayUrls } from "../helpers/relay";

export type RelayDirectory = Record<string, { read: boolean; write: boolean }>;

export const KNOWN_MONERO_RELAYS = new RelaySet(
	safeRelayUrls([
		"wss://nostr.portemonero.com",
		"wss://xmr.usenostr.org",
		"wss://nostr.xmr.rocks",
		"wss://nerostr.xmr.rocks",
		"wss://xmr.ithurtswhenip.ee",
		"wss://relay.mostard.org",
	]),
);

export const KNOWN_ONION_RELAYS = new RelaySet(
	safeRelayUrls([
		"ws://oxtrdevav64z64yb7x6rjg4ntzqjhedm5b5zjqulugknhzr46ny2qbad.onion",
		"wss://skzzn6cimfdv5e2phjc4yr5v7ikbxtn5f7dkwn5c7v47tduzlbosqmqd.onion",
		"ws://2jsnlhfnelig5acq6iacydmzdbdmg7xwunm4xl6qwbvzacw4lwrjmlyd.onion",
		"ws://nostrland2gdw7g3y77ctftovvil76vquipymo7tsctlxpiwknevzfid.onion",
		"ws://bitcoinr6de5lkvx4tpwdmzrdfdpla5sya2afwpcabjup2xpi5dulbad.onion",
		"ws://nerostrrgb5fhj6dnzhjbgmnkpy2berdlczh6tuh2jsqrjok3j4zoxid.onion",
	]),
);

export const recommendedReadRelays = new RelaySet(
	safeRelayUrls([
		"wss://relay.damus.io/",
		"wss://nostr.wine/",
		"wss://relay.snort.social/",
		"wss://nos.lol/",
		"wss://purplerelay.com/",
		"wss://nostr.land/",
	]),
);
export const recommendedWriteRelays = new RelaySet(
	safeRelayUrls([
		"wss://relay.damus.io/",
		"wss://nos.lol/",
		"wss://purplerelay.com/",
	]),
);

class ClientRelayService {
	readRelays = new BehaviorSubject(new RelaySet());
	writeRelays = new BehaviorSubject(new RelaySet());

	log = logger.extend("ClientRelays");

	constructor() {
		const cachedRead = localStorage.getItem("read-relays")?.split(",");
		if (cachedRead) this.readRelays.next(RelaySet.from(cachedRead));

		const cachedWrite = localStorage.getItem("write-relays")?.split(",");
		if (cachedWrite) this.writeRelays.next(RelaySet.from(cachedWrite));
	}

	addRelay(url: string, mode: RelayMode) {
		if (mode & RelayMode.WRITE && !this.writeRelays.value.has(url))
			this.writeRelays.next(this.writeRelays.value.clone().add(url));

		if (mode & RelayMode.READ && !this.readRelays.value.has(url))
			this.readRelays.next(this.readRelays.value.clone().add(url));

		this.saveRelays();
	}
	removeRelay(url: string, mode: RelayMode) {
		if (mode & RelayMode.WRITE) {
			const next = this.writeRelays.value.clone();
			next.delete(url);
			this.writeRelays.next(next);
		}
		if (mode & RelayMode.READ) {
			const next = this.readRelays.value.clone();
			next.delete(url);
			this.readRelays.next(next);
		}

		this.saveRelays();
	}
	setRelaysFromRelaySet(event: NostrEvent) {
		this.writeRelays.next(RelaySet.fromNIP65Event(event, RelayMode.WRITE));
		this.readRelays.next(RelaySet.fromNIP65Event(event, RelayMode.ALL));
		this.saveRelays();
	}

	saveRelays() {
		localStorage.setItem("read-relays", this.readRelays.value.urls.join(","));
		localStorage.setItem("write-relays", this.writeRelays.value.urls.join(","));
	}
}

const clientRelaysService = new ClientRelayService();

if (import.meta.env.DEV) {
	// @ts-ignore
	window.clientRelaysService = clientRelaysService;
}

export default clientRelaysService;

import { safeRelayUrls } from "applesauce-core/helpers";
import type { EventFactoryClient } from "applesauce-factory";
import { kinds } from "nostr-tools";

export const DEFAULT_SEARCH_RELAYS = safeRelayUrls([
	"wss://relay.nostr.band",
	"wss://search.nos.today",
	"wss://relay.noswhere.com",
	"wss://filter.nostr.wine",
]);
export const WIKI_RELAYS = safeRelayUrls(["wss://relay.wikifreedia.xyz/"]);
export const COMMON_CONTACT_RELAYS = safeRelayUrls(["wss://purplepag.es/"]);

export const DEFAULT_SIGNAL_RELAYS = safeRelayUrls([
	"wss://nostrue.com/",
	"wss://relay.damus.io",
]);
export const DEFAULT_NOSTR_CONNECT_RELAYS = safeRelayUrls([
	"wss://relay.nsec.app/",
]);

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
	{
		urls: ["stun:freeturn.net:3479"],
	},
	{
		urls: ["turn:freeturn.net:3479"],
		username: "free",
		credential: "free",
	},
	{
		urls: ["stun:stun.l.google.com:19302"],
	},
	{
		urls: ["turn:172.234.18.173:3478"],
		username: "free",
		credential: "free",
	},
];

export const RECOMMENDED_READ_RELAYS = safeRelayUrls([
	"wss://relay.damus.io/",
	"wss://nostr.wine/",
	"wss://relay.snort.social/",
	"wss://nos.lol/",
	"wss://purplerelay.com/",
	"wss://nostr.land/",
]);
export const RECOMMENDED_WRITE_RELAYS = safeRelayUrls([
	"wss://relay.damus.io/",
	"wss://nos.lol/",
	"wss://purplerelay.com/",
]);

export const NOSTR_CONNECT_PERMISSIONS = [
	"get_public_key",
	"nip04_encrypt",
	"nip04_decrypt",
	"nip44_encrypt",
	"nip44_decrypt",
	"sign_event:0",
	"sign_event:1",
	"sign_event:3",
	"sign_event:4",
	"sign_event:6",
	"sign_event:7",
];

export const NEVER_ATTACH_CLIENT_TAG = [kinds.EncryptedDirectMessage];

export const NIP_89_CLIENT_APP: EventFactoryClient = {
	name: "moStard",
	address: {
		pubkey: "877308276be50ce9bafa7e5e374e4fcbf5e9859a21918f34baefd000746b7d35",
		identifier: "1732044917",
	},
};

export const SUPPORT_PUBKEY =
	"877308276be50ce9bafa7e5e374e4fcbf5e9859a21918f34baefd000746b7d35";

export const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY as
	| string
	| undefined;

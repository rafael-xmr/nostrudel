import { EventFactoryClient } from "applesauce-factory";
import { isSafeRelayURL } from "applesauce-core/helpers/relays";
import { normalizeURL } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";

function normalizeRelayURLs(relays: string[]) {
	return relays.filter(isSafeRelayURL).map(normalizeURL);
}

export const DEFAULT_SEARCH_RELAYS = normalizeRelayURLs([
	"wss://relay.nostr.band",
	"wss://search.nos.today",
	"wss://relay.noswhere.com",
	"wss://filter.nostr.wine",
]);
export const WIKI_RELAYS = normalizeRelayURLs(["wss://relay.wikifreedia.xyz/"]);
export const COMMON_CONTACT_RELAYS = normalizeRelayURLs([
	"wss://purplepag.es/",
]);

export const DEFAULT_SIGNAL_RELAYS = normalizeRelayURLs([
	"wss://nostrue.com/",
	"wss://relay.damus.io",
]);
export const DEFAULT_NOSTR_CONNECT_RELAYS = normalizeRelayURLs([
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

export const RECOMMENDED_READ_RELAYS = normalizeRelayURLs([
	"wss://relay.damus.io/",
	"wss://nostr.wine/",
	"wss://relay.snort.social/",
	"wss://nos.lol/",
	"wss://purplerelay.com/",
	"wss://nostr.land/",
]);
export const RECOMMENDED_WRITE_RELAYS = normalizeRelayURLs([
	"wss://relay.damus.io/",
	"wss://nos.lol/",
	"wss://purplerelay.com/",
]);

export const JAPANESE_RELAYS = normalizeRelayURLs([
	"wss://r.kojira.io",
	"wss://nrelay-jp.c-stellar.net",
	"wss://nostr.fediverse.jp",
	"wss://nostr.holybea.com",
	"wss://relay-jp.nostr.wirednet.jp",
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

export const TENOR_API_KEY = process.env.NEXT_PUBLIC_VITE_TENOR_API_KEY as
	| string
	| undefined;

// copied from github
export const NIP_NAMES: Record<string, string> = {
  "01": "Basic protocol",
  "02": "Follow List",
  "03": "OpenTimestamps Attestations for Events",
  "04": "Encrypted Direct Message",
  "05": "Mapping Nostr keys to DNS-based internet identifiers",
  "06": "Basic key derivation from mnemonic seed phrase",
  "07": "window.nostr capability for web browsers",
  "08": "Handling Mentions",
  "09": "Event Deletion Request",
  "10": "Conventions for clients' use of `e` and `p` tags in text events",
  "11": "Relay Information Document",
  "13": "Proof of Work",
  "14": "Subject tag in text events",
  "15": "Nostr Marketplace (for resilient marketplaces)",
  "17": "Private Direct Messages",
  "18": "Reposts",
  "19": "bech32-encoded entities",
  "21": "nostr: URI scheme",
  "22": "Comment",
  "23": "Long-form Content",
  "24": "Extra metadata fields and tags",
  "25": "Reactions",
  "26": "Delegated Event Signing",
  "27": "Text Note References",
  "28": "Public Chat",
  "29": "Relay-based Groups",
  "30": "Custom Emoji",
  "31": "Dealing with Unknown Events",
  "32": "Labeling",
  "34": "git stuff",
  "35": "Torrents",
  "36": "Sensitive Content",
  "37": "Draft Events",
  "38": "User Statuses",
  "39": "External Identities in Profiles",
  "40": "Expiration Timestamp",
  "42": "Authentication of clients to relays",
  "44": "Encrypted Payloads (Versioned)",
  "45": "Counting results",
  "46": "Nostr Remote Signing",
  "47": "Nostr Wallet Connect",
  "48": "Proxy Tags",
  "49": "Private Key Encryption",
  "50": "Search Capability",
  "51": "Lists",
  "52": "Calendar Events",
  "53": "Live Activities",
  "54": "Wiki",
  "55": "Android Signer Application",
  "56": "Reporting",
  "57": "Lightning Zaps",
  "58": "Badges",
  "59": "Gift Wrap",
  "60": "Cashu Wallet",
  "61": "Nutzaps",
  "64": "Chess (PGN)",
  "65": "Relay List Metadata",
  "68": "Picture-first feeds",
  "69": "Peer-to-peer Order events",
  "70": "Protected Events",
  "71": "Video Events",
  "72": "Moderated Communities",
  "73": "External Content IDs",
  "75": "Zap Goals",
  "78": "Application-specific data",
  "84": "Highlights",
  "86": "Relay Management API",
  "89": "Recommended Application Handlers",
  "90": "Data Vending Machines",
  "92": "Media Attachments",
  "94": "File Metadata",
  "96": "HTTP File Storage Integration",
  "98": "HTTP Auth",
  "99": "Classified Listings",
  "7D": "Threads",
  C7: "Chats",
};

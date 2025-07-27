import { Relay } from "applesauce-relay";
import { nip11 } from "nostr-tools";
import type { RelayInformation } from "nostr-tools/nip11";
import { from } from "rxjs";
import type { RequestProxyManagement } from "../helpers/request";

import type { DatabaseManagement } from "./database";

export interface RelayInfoManagement {
	getInfo: (
		relay: string,
		alwaysFetch?: boolean,
	) => Promise<RelayInformation | null>;
}

export default async function createRelayInfoManagement(
	databaseManagement: DatabaseManagement,
	requestProxyManagement: RequestProxyManagement,
): Promise<RelayInfoManagement> {
	// Use proxy fetch implementation
	nip11.useFetchImplementation(requestProxyManagement.fetchWithProxy);

	const db = await databaseManagement.database;

	const getInfo = async (
		relay: string,
		alwaysFetch = false,
	): Promise<RelayInformation | null> => {
		let info = (await db.get("relayInfo", relay)) as RelayInformation | null;

		if (!info || alwaysFetch) {
			try {
				info = await nip11.fetchRelayInformation(relay);
				db.put("relayInfo", info, relay);
			} catch (_) {
				return null;
			}
		}
		return info;
	};

	// Set up the global relay information fetcher
	Relay.fetchInformationDocument = (url) => from(getInfo(url, true));

	// Debug exposure
	if (import.meta.env.DEV) {
		// @ts-expect-error debug
		window.relayInfoService = { getInfo };
	}

	return {
		getInfo,
	};
}

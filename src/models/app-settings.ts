import type { Model } from "applesauce-core";
import { safeParse } from "applesauce-core/helpers/json";
import type { ProfilePointer } from "nostr-tools/nip19";
import { map } from "rxjs";

import {
	APP_SETTING_IDENTIFIER,
	APP_SETTINGS_KIND,
	type AppSettings,
	DEFAULT_APP_SETTINGS,
} from "../helpers/app-settings";

import createAddressableQueryManagement from "./addressable";
import type { EventStoreManagement } from "../services/event-store";
import type { LoadersManagement } from "../services/loaders";

export function AppSettingsQuery(
	pubkey: string | ProfilePointer,
	eventStoreManagement: EventStoreManagement,
	loadersManagement: LoadersManagement,
): Model<AppSettings> {
	const pointer = typeof pubkey === "string" ? { pubkey } : pubkey;

	return (events) =>
		events
			.model(
				createAddressableQueryManagement(
					eventStoreManagement,
					loadersManagement,
				).AddressableQuery,
				{
					kind: APP_SETTINGS_KIND,
					pubkey: pointer.pubkey,
					identifier: APP_SETTING_IDENTIFIER,
					relays: pointer.relays,
				},
			)
			.pipe(
				map((event) => {
					if (!event) return DEFAULT_APP_SETTINGS;
					const parsed = safeParse<Partial<AppSettings>>(event.content);
					return { ...DEFAULT_APP_SETTINGS, ...parsed };
				}),
			);
}

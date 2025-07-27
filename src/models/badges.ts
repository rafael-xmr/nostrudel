import type { Model } from "applesauce-core";
import { kinds, type NostrEvent } from "nostr-tools";
import type {
	AddressPointer,
	EventPointer,
	ProfilePointer,
} from "nostr-tools/nip19";
import { combineLatest, filter, of, switchMap } from "rxjs";

import {
	getProfileBadges,
	PROFILE_BADGES_IDENTIFIER,
} from "../helpers/nostr/badges";
import EventQuery from "./events";

import createAddressableQueryManagement from "./addressable";
import type { EventStoreManagement } from "../services/event-store";
import type { LoadersManagement } from "../services/loaders";

export function ProfileBadgesQuery(
	user: ProfilePointer,
	eventStoreManagement: EventStoreManagement,
	loadersManagement: LoadersManagement,
): Model<
	{
		badge: NostrEvent | undefined;
		badgePointer: AddressPointer;
		award: NostrEvent | undefined;
		awardPointer: EventPointer;
	}[]
> {
	return (events) =>
		events
			.model(
				createAddressableQueryManagement(
					eventStoreManagement,
					loadersManagement,
				).AddressableQuery,
				{
					...user,
					kind: kinds.ProfileBadges,
					identifier: PROFILE_BADGES_IDENTIFIER,
				},
			)
			.pipe(
				// Wait for the event to be loaded
				filter((b) => !!b),
				// Request the badge events
				switchMap((event) =>
					combineLatest(
						getProfileBadges(event).map((badge) =>
							combineLatest({
								badge: events.model(
									createAddressableQueryManagement(
										eventStoreManagement,
										loadersManagement,
									).AddressableQuery,
									badge.badge,
								),
								award: events.model(EventQuery, badge.award, loadersManagement),
								badgePointer: of(badge.badge),
								awardPointer: of(badge.award),
							}),
						),
					),
				),
			);
}

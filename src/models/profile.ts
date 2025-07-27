import type { Model } from "applesauce-core";
import type { ProfileContent } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";
import type { ProfilePointer } from "nostr-tools/nip19";
import { combineLatest, EMPTY, ignoreElements, mergeWith, defer } from "rxjs";

import type { LoadersManagement } from "~/services/loaders";

/** A model that loads a users profile */
export function ProfileQuery(
	pubkey: string | ProfilePointer,
	loadersManagement: LoadersManagement,
): Model<ProfileContent | undefined> {
	const pointer = typeof pubkey === "string" ? { pubkey } : pubkey;
	return (events) =>
		defer(() =>
			events.hasReplaceable(kinds.Metadata, pointer.pubkey)
				? EMPTY
				: loadersManagement.profileLoader({
						kind: kinds.Metadata,
						pubkey: pointer.pubkey,
						relays: pointer.relays,
					}),
		).pipe(ignoreElements(), mergeWith(events.profile(pointer.pubkey)));
}

/** A model that loads a record ofusers profiles */
export function UserProfilesQuery(
	pubkeys: string[],
	loadersManagement: LoadersManagement,
): Model<Record<string, ProfileContent | undefined>> {
	return (events) => {
		const profiles = Object.fromEntries(
			pubkeys.map((pubkey) => [
				pubkey,
				events.model(ProfileQuery, pubkey, loadersManagement),
			]),
		);
		return combineLatest(profiles);
	};
}

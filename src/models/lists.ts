import type { Model } from "applesauce-core";
import type { NostrEvent } from "nostr-tools";
import type { ProfilePointer } from "nostr-tools/nip19";
import { defer, ignoreElements, map, mergeWith } from "rxjs";

import { isJunkList, SET_KINDS } from "../helpers/nostr/lists";
import type { LoadersManagement } from "~/services/loaders";

export function UserListsQuery(
	user: ProfilePointer,
	loadersManagement: LoadersManagement,
): Model<NostrEvent[]> {
	return (events) =>
		defer(() => loadersManagement.userSetsLoader(user)).pipe(
			ignoreElements(),
			mergeWith(events.timeline({ authors: [user.pubkey], kinds: SET_KINDS })),
			map((events) => events.filter((e) => !isJunkList(e))),
		);
}

import { useEffect } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import { TimelineQuery } from "applesauce-core/queries";

import { SET_KINDS, isJunkList } from "../helpers/nostr/lists";
import { useReadRelays } from "./use-client-relays";
import { useUserSetsLoader } from "~/providers/global/user-sets-loader-provider";

export default function useUserSets(
	pubkey?: string,
	additionalRelays?: Iterable<string>,
	force?: boolean,
) {
	const readRelays = useReadRelays(additionalRelays);
	const userSetsLoader = useUserSetsLoader();

	useEffect(() => {
		if (pubkey) {
			for (const kind of SET_KINDS) {
				userSetsLoader?.next({
					kind,
					pubkey,
					relays: [...readRelays],
					force,
				});
			}
		}
	}, [userSetsLoader, pubkey, readRelays.join("|"), force]);

	return (
		useStoreQuery(
			TimelineQuery,
			pubkey
				? [
						{
							authors: [pubkey],
							kinds: SET_KINDS,
						},
					]
				: undefined,
		)?.filter((e) => !isJunkList(e)) ?? []
	);
}

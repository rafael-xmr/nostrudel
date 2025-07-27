import { type PropsWithChildren, createContext, useContext } from "react";
import { type Emoji, getEventUID } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";

import useReplaceableEvents from "../../hooks/use-replaceable-events";
import useFavoriteEmojiPacks from "../../hooks/use-favorite-emoji-packs";
import { getPackCordsFromFavorites } from "../../helpers/nostr/emoji-packs";
import type { NostrEvent } from "nostr-tools";

const EmojiContext = createContext<Emoji[]>([]);

export function useContextEmojis() {
	return useContext(EmojiContext);
}

export function getEmojis(pack: NostrEvent): Emoji[] {
	const id = getEventUID(pack);

	return pack.tags
		.filter((t) => t[0] === "emoji" && t[1] && t[2])
		.map((t) => {
			return {
				id: `${id}-${t[1] as string}`,
				shortcode: t[1] as string,
				url: t[2] as string,
			};
		});
}

export function UserEmojiProvider({
	children,
	pubkey,
}: PropsWithChildren & { pubkey?: string }) {
	const account = useActiveAccount();
	const favoriteList = useFavoriteEmojiPacks(
		pubkey || account?.pubkey,
		undefined,
		true,
	);

	const favoritePacks = useReplaceableEvents(
		favoriteList && getPackCordsFromFavorites(favoriteList),
	);
	const emojis = favoritePacks.flatMap((pack) => getEmojis(pack));

	return <EmojiProvider emojis={emojis}>{children}</EmojiProvider>;
}

export default function EmojiProvider({
	children,
	emojis,
}: PropsWithChildren & { emojis: Emoji[] }) {
	const parent = useContext(EmojiContext);

	return (
		<EmojiContext.Provider value={[...parent, ...emojis]}>
			{children}
		</EmojiContext.Provider>
	);
}

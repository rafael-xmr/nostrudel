import * as React from "react";
import {
	type Emoji,
	getEmojis,
	getEventUID,
	getPackName,
} from "applesauce-core/helpers";
import { getAddressPointersFromList } from "applesauce-core/helpers/lists";
import { useActiveAccount } from "applesauce-react/hooks";

import EmojiPicker, {
	defaultCategories,
	type NativeEmoji,
} from "./emoji-picker";
import useFavoriteEmojiPacks from "../../hooks/use-favorite-emoji-packs";
import useReplaceableEvents from "../../hooks/use-replaceable-events";

export default function ReactionPicker({
	autoFocus,
	onSelect,
}: {
	autoFocus?: boolean;
	onSelect?: (emoji: string | Emoji) => void;
}) {
	const account = useActiveAccount();
	const favoritePacks = useFavoriteEmojiPacks(account?.pubkey);

	const packs = useReplaceableEvents(
		favoritePacks ? getAddressPointersFromList(favoritePacks) : [],
	);

	// Use a ref to cache the previous non-empty packs
	const cachedPacks = React.useRef(packs);

	// Update the cached value if packs is not empty
	React.useEffect(() => {
		if (packs.length > 0) {
			cachedPacks.current = packs;
		}
	}, [packs]);

	// Use the cached packs if the current packs is empty
	const effectivePacks = packs.length > 0 ? packs : cachedPacks.current;

	const custom = React.useMemo(
		() =>
			effectivePacks.map((pack) => {
				const id = getEventUID(pack);
				const name = getPackName(pack) || "Unnamed";
				const emojis = getEmojis(pack);

				return {
					id,
					name,
					emojis: emojis.map((e) => ({
						id: e.name,
						name: e.name,
						keywords: [
							e.name,
							e.name.toUpperCase(),
							e.name.replaceAll("_", ""),
						],
						skins: [{ src: e.url }],
					})),
				};
			}),
		[effectivePacks],
	);

	const categories = React.useMemo(
		() => [...effectivePacks.map((p) => getEventUID(p)), ...defaultCategories],
		[effectivePacks],
	);

	const handleSelect = (emoji: NativeEmoji) => {
		if (emoji.src) onSelect?.({ name: emoji.name, url: emoji.src });
		else if (emoji.id === "+1") onSelect?.("+");
		else if (emoji.id === "-1") onSelect?.("-");
		else if (emoji.native) onSelect?.(emoji.native);
	};

	return (
		<EmojiPicker
			key={JSON.stringify(effectivePacks)} // Force re-render when effectivePacks changes
			autoFocus={autoFocus}
			onEmojiSelect={handleSelect}
			custom={custom}
			categories={categories}
		/>
	);
}

import { Box, type BoxProps } from "@chakra-ui/react";
import type { NostrEvent } from "nostr-tools";
import { useRenderedContent } from "applesauce-react/hooks";
import {
	emojis,
	nostrMentions,
	links,
	hashtags,
} from "applesauce-content/text";

import { components } from "../content";
import { renderGenericUrl } from "../content/links";
import { nipDefinitions } from "../content/transform/nip-notation";
import { moneroAddressLinks } from "../content/transform/monero-notation";

const transformers = [
	links,
	nostrMentions,
	emojis,
	hashtags,
	nipDefinitions,
	moneroAddressLinks,
];

const linkRenderers = [renderGenericUrl];

const MediaPostContentSymbol = Symbol.for("media-post-content");

export default function MediaPostContents({
	post,
	...props
}: { post: NostrEvent } & Omit<BoxProps, "children">) {
	const content = useRenderedContent(post, components, {
		linkRenderers,
		transformers,
		cacheKey: MediaPostContentSymbol,
	});

	return (
		<Box whiteSpace="pre-wrap" dir="auto" {...props}>
			{content}
		</Box>
	);
}

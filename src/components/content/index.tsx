import { Link, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import type { ComponentMap } from "applesauce-react/hooks";

import Mention from "./components/mention";
import { InlineEmoji } from "./components/ininle-emoji";
import { ImageGallery } from "./components/gallery";
import MoneroDefinition from "./components/monero";
import NipDefinition from "./components/nip";

export const components: ComponentMap = {
	text: ({ node }) => <Text as="span">{node.value}</Text>,
	mention: Mention,
	emoji: ({ node }) => <InlineEmoji url={node.url} code={node.code} />,
	hashtag: ({ node }) => (
		<Link as={RouterLink} to={`/t/${node.hashtag}`} color="blue.500">
			#{node.name}
		</Link>
	),
	nip: NipDefinition,
	gallery: ({ node }) => <ImageGallery images={node.links} />,
	monero: MoneroDefinition,
};

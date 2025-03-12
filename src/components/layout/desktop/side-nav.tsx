import { useState } from "react";
import {
	ButtonGroup,
	Flex,
	type FlexProps,
	IconButton,
	Text,
	Image,
	Heading,
	LinkOverlay,
	Link,
} from "@chakra-ui/react";

import { ChevronLeftIcon, ChevronRightIcon, GithubIcon } from "../../icons";
import NavItems from "../components";
import useRootPadding from "../../../hooks/use-root-padding";
import AccountSwitcher from "../components/account-switcher";
import { CollapsedContext } from "../context";
import RelayConnectionButton from "../components/connections-button";
import PublishLogButton from "../components/publish-log-button";
import RouterLink from "~/components/router-link";
import SupportButton from "~/components/support-button";

export default function DesktopSideNav({
	...props
}: Omit<FlexProps, "children">) {
	const [collapsed, setCollapsed] = useState(false);

	useRootPadding({
		left: collapsed ? "var(--chakra-sizes-16)" : "var(--chakra-sizes-64)",
	});

	return (
		<CollapsedContext.Provider value={collapsed}>
			<Flex
				direction="column"
				gap="2"
				px="2"
				py="2"
				shrink={0}
				borderRightWidth={1}
				pt="calc(var(--chakra-space-2) + var(--safe-top))"
				pb="calc(var(--chakra-space-2) + var(--safe-bottom))"
				w={collapsed ? "16" : "64"}
				position="fixed"
				left="0"
				bottom="0"
				top="0"
				zIndex="modal"
				overflowY="auto"
				overflowX="hidden"
				overscroll="none"
				backgroundColor="var(--chakra-colors-whiteAlpha-200)"
				_scrollbar={{
					display: "none",
				}}
				css={{
					"&::-webkit-scrollbar": {
						width: "0px",
					},
				}}
				{...props}
			>
				<Flex gap="2" px="2" alignItems="center" position="relative">
					<Image src="/transparent.png" boxSize="64px" />

					<Heading size="md">
						<LinkOverlay as={RouterLink} to="/">
							moStard
						</LinkOverlay>
					</Heading>
				</Flex>

				<NavItems />

				<AccountSwitcher />

				<ButtonGroup variant="ghost">
					<IconButton
						aria-label={collapsed ? "Open" : "Close"}
						title={collapsed ? "Open" : "Close"}
						onClick={() => setCollapsed(!collapsed)}
						icon={
							collapsed ? (
								<ChevronRightIcon boxSize={6} />
							) : (
								<ChevronLeftIcon boxSize={6} />
							)
						}
					/>
					{!collapsed && (
						<>
							<RelayConnectionButton w="full" />
							<PublishLogButton flexShrink={0} />
						</>
					)}
				</ButtonGroup>

				<SupportButton />

				{/* TODO: monthly goal */}
				<Text>Cheers!</Text>

				<Image src="/monero_chan.webp" />

				<Flex alignItems="center">
					<Link
						href="https://github.com/rafael-xmr/nostrudel/tree/mostard"
						target="_blank"
						rel="noreferrer"
					>
						FOSS <GithubIcon boxSize={5} mx={1} />
					</Link>
					{/* TODO: commit version */}
					{/* {version && ( */}
					{/* 	<div> */}
					{/* 		running{" "} */}
					{/* 		<a */}
					{/* 			href={} */}
					{/* 			target="_blank" */}
					{/* 			rel="noreferrer" */}
					{/* 		> */}
					{/* 			{version} */}
					{/* 		</a> */}
					{/* 	</div> */}
					{/* )} */}
				</Flex>
			</Flex>
		</CollapsedContext.Provider>
	);
}

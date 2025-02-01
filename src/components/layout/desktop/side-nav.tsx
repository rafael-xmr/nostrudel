import { useState } from "react";
import {
	ButtonGroup,
	Flex,
	type FlexProps,
	IconButton,
	Link,
	Text,
	Image,
	Avatar,
	Heading,
	LinkOverlay,
	Circle,
} from "@chakra-ui/react";

import { ChevronLeftIcon, ChevronRightIcon } from "../../icons";
import NavItems from "../components";
import useRootPadding from "../../../hooks/use-root-padding";
import AccountSwitcher from "../components/account-switcher";
import { CollapsedContext } from "../context";
import RelayConnectionButton from "../components/connections-button";
import PublishLogButton from "../components/publish-log-button";
import RouterLink from "~/components/router-link";

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
				<Text>
					To support{" "}
					<Link
						href="monero:85kUEzPzBopaXUJ5dL19J6deh5md6YZDZLUUpv63wXdCiRo3pPwrAJHAKAsSo4BgKQBpcs5hSth23hEFr5mmNxRxMeDY1Ng"
						isExternal
						color="blue.500"
						fontStyle="initial"
					>
						donate!!
					</Link>{" "}
					or{" "}
					<Link
						href="https://relay.mostard.org"
						isExternal
						color="blue.500"
						fontStyle="initial"
					>
						join the relay!!
					</Link>{" "}
					(and add it to your list).
				</Text>
				<Image src="/qr_with_logo_black2.png" />
				{/* TODO: monthly goal */}
				<Text>Cheers!</Text>
				<Image src="/monero_chan.webp" />
			</Flex>
		</CollapsedContext.Provider>
	);
}

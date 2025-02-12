import { useContext } from "react";
import {
	Avatar,
	Box,
	Button,
	Flex,
	type FlexProps,
	Heading,
	LinkOverlay,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { css } from "@emotion/react";

import { useActiveAccount } from "applesauce-react/hooks";
import AccountSwitcher from "./components/account-switcher";
import NavItems from "./desktop/side-nav";
import { PostModalContext } from "../../providers/route/post-modal-provider";
import { WritingIcon } from "../icons";
import { ReadonlyAccount } from "applesauce-accounts/accounts";

const hideScrollbar = css`
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export default function DesktopSideNav(props: Omit<FlexProps, "children">) {
	const account = useActiveAccount();
	const { openModal } = useContext(PostModalContext);

	return (
		<Flex
			{...props}
			gap="2"
			direction="column"
			width="15rem"
			p="2"
			alignItems="stretch"
			flexShrink={0}
			h="100vh"
			overflowY="auto"
			overflowX="hidden"
			css={hideScrollbar}
		>
			<Flex direction="column" flexShrink={0} gap="2">
				<Flex gap="2" alignItems="center" position="relative" my="2">
					<Avatar src="/transparent.png" size="md" />
					<Heading size="md">
						<LinkOverlay as={RouterLink} to="/">
							moStard
						</LinkOverlay>
					</Heading>
				</Flex>

				{account && (
					<>
						<AccountSwitcher />
						<Button
							leftIcon={<WritingIcon boxSize={6} />}
							aria-label="Write Note"
							title="Write Note"
							onClick={() => openModal()}
							colorScheme="primary"
							size="lg"
							isDisabled={account instanceof ReadonlyAccount}
						>
							Write Note
						</Button>
					</>
				)}
				<NavItems />
				<Box h="4" />
				{!account && (
					<Button
						as={RouterLink}
						to="/signin"
						state={{ from: location.pathname }}
						colorScheme="primary"
						w="full"
						flexShrink={0}
					>
						Sign in
					</Button>
				)}
			</Flex>
		</Flex>
	);
}

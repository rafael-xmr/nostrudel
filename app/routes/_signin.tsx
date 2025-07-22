import * as React from "react";

import { Avatar, Flex, Heading } from "@chakra-ui/react";
import { NoLayoutTopPage } from "../root";
import { Outlet } from "react-router-dom";
import { useNavigate } from "@remix-run/react";
import { useActiveAccount } from "applesauce-react/hooks";

export default function Signin() {
	const current = useActiveAccount();
	const navigate = useNavigate();

	React.useEffect(() => {
		if (current) {
			navigate(-1);
		}
	}, [current, navigate]);

	return (
		<NoLayoutTopPage>
			<Flex w="full" justifyContent="center">
				<Flex
					direction="column"
					alignItems="center"
					gap="2"
					maxW="md"
					w="full"
					px="4"
					py="10"
				>
					<Avatar src="/transparent.jpeg" size="lg" flexShrink={0} />
					<Heading size="lg" mb="2">
						Sign in
					</Heading>

					<Outlet />
				</Flex>
			</Flex>
		</NoLayoutTopPage>
	);
}

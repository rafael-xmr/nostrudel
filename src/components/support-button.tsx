import {
	Button,
	Modal,
	ModalCloseButton,
	ModalContent,
	ModalOverlay,
	useDisclosure,
	Tabs,
	TabList,
	TabPanels,
	Tab,
	TabPanel,
	useTheme,
	useColorModeValue,
} from "@chakra-ui/react";
import { TipModalContents, TipModalHeader } from "./event-tip-modal";
import { MoneroBlackIcon, MoneroWhiteIcon } from "./icons";
import { useBreakpointValue } from "~/providers/global/breakpoint-provider";
import { useEffect, useRef, useState } from "react";
import * as reactUse from "react-use";
import { useActiveAccount } from "applesauce-react/hooks";

export default function SupportButton() {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const account = useActiveAccount();

	const isMobile = useBreakpointValue({ base: true, md: false });
	const label = "Click to Support moStard";
	const [tabIndex, setTabIndex] = useState(0);

	const paymentDetailsRef = useRef(null);
	const initialPaymentOkResponseRef = useRef<boolean | null>(null);
	const paymentOkRef = useRef<boolean | null>(null);

	reactUse.useAsync(async () => {
		if (tabIndex === 1 && paymentDetailsRef.current === null && account) {
			const res = await fetch(
				`https://relay.mostard.org/api/user/${account!.pubkey}`,
				{
					method: "POST",
				},
			);
			const body = await res.json();

			if (body?.status === "ok") {
				paymentOkRef.current = true;

				if (!paymentDetailsRef.current) {
					initialPaymentOkResponseRef.current = true;
				}
			} else if (body?.address) {
				paymentDetailsRef.current = body;
			}
		}
	}, [tabIndex]);

	useEffect(() => {
		if (paymentDetailsRef.current && tabIndex === 1) {
			const interval = setInterval(async () => {
				const res = await fetch(
					`https://relay.mostard.org/api/user/${account!.pubkey}`,
					{
						method: "POST",
					},
				);
				const body = await res.json();

				console.log(body);

				if (body?.status === "ok") {
					paymentOkRef.current = true;
					clearInterval(interval);
				}
			}, 5000);

			return () => clearInterval(interval);
		}
	}, [account, tabIndex]);

	const theme = useTheme();
	const token = theme.semanticTokens.colors["chakra-body-text"];
	const color = useColorModeValue(token._light, token._dark) as string;
	const MoneroIcon = color !== token._light ? MoneroBlackIcon : MoneroWhiteIcon;

	return (
		<>
			<Button
				aria-label={label}
				title={label}
				leftIcon={<MoneroIcon boxSize={5} />}
				variant="solid"
				p="2"
				justifyContent="flex-start"
				colorScheme="primary"
				flexShrink={0}
				backgroundColor={color}
				onClick={onOpen}
			>
				{label}
			</Button>

			{isOpen && (
				<Modal
					isOpen={isOpen}
					onClose={onClose}
					size={isMobile ? "full" : "xl"}
				>
					<ModalOverlay />
					<ModalContent>
						<ModalCloseButton />
						<TipModalHeader pubkey="dbe0b6bc5f455a547da4b2644846aaf88f466543604130d8fa662625c1eade8f" />

						<Tabs onChange={(index) => setTabIndex(index)}>
							<TabList>
								<Tab>Donation</Tab>
							</TabList>

							<TabPanels>
								<TabPanel padding="0">
									{tabIndex === 0 && (
										<TipModalContents
											pubkey="dbe0b6bc5f455a547da4b2644846aaf88f466543604130d8fa662625c1eade8f"
											address="85kUEzPzBopaXUJ5dL19J6deh5md6YZDZLUUpv63wXdCiRo3pPwrAJHAKAsSo4BgKQBpcs5hSth23hEFr5mmNxRxMeDY1Ng"
											description="If you are enjoying this app, consider supporting the developer! Every little bit helps. Thanks!"
										/>
									)}
								</TabPanel>
							</TabPanels>
						</Tabs>
					</ModalContent>
				</Modal>
			)}
		</>
	);
}

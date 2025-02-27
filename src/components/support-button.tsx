import {
	Button,
	Modal,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	useDisclosure,
	Tabs,
	TabList,
	TabPanels,
	Tab,
	TabPanel,
	Spinner,
	Flex,
} from "@chakra-ui/react";
import { ZapModalContents, ZapModalHeader } from "./event-zap-modal";
import { MoneroBlackIcon } from "./icons";
import { useBreakpointValue } from "~/providers/global/breakpoint-provider";
import { useEffect, useRef, useState } from "react";
import { useAsync } from "react-use";
import { useActiveAccount } from "applesauce-react/hooks";
import { CheckCircleIcon } from "@chakra-ui/icons";

export default function SupportButton() {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const account = useActiveAccount();

	const isMobile = useBreakpointValue({ base: true, md: false });
	const label = "Click to Support moStard";
	const [tabIndex, setTabIndex] = useState(0);

	const paymentDetailsRef = useRef(null);
	const initialPaymentOkResponseRef = useRef<boolean | null>(null);
	const paymentOkRef = useRef<boolean | null>(null);

	useAsync(async () => {
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

	return (
		<>
			<Button
				aria-label={label}
				title={label}
				leftIcon={<MoneroBlackIcon boxSize={5} />}
				variant="solid"
				p="2"
				justifyContent="flex-start"
				colorScheme="primary"
				flexShrink={0}
				backgroundColor="white"
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
						<ZapModalHeader pubkey="dbe0b6bc5f455a547da4b2644846aaf88f466543604130d8fa662625c1eade8f" />

						<Tabs onChange={(index) => setTabIndex(index)}>
							<TabList>
								<Tab>Donation</Tab>
								<Tab>Pay for Relay</Tab>
							</TabList>

							<TabPanels>
								<TabPanel>
									{tabIndex === 0 && (
										<ZapModalContents
											pubkey="dbe0b6bc5f455a547da4b2644846aaf88f466543604130d8fa662625c1eade8f"
											address="85kUEzPzBopaXUJ5dL19J6deh5md6YZDZLUUpv63wXdCiRo3pPwrAJHAKAsSo4BgKQBpcs5hSth23hEFr5mmNxRxMeDY1Ng"
											description="Every little bit helps. Thank you for considering supporting this project! 🙏"
										/>
									)}
								</TabPanel>
								<TabPanel>
									{paymentOkRef.current === true ? (
										<>
											<ModalHeader p="0">
												{initialPaymentOkResponseRef.current ? (
													<>You already joined the moStard Relay!</>
												) : (
													<>You joined the moStard Relay!</>
												)}
											</ModalHeader>

											<CheckCircleIcon color="green" boxSize={"max"} p="40" />
										</>
									) : (
										<Flex direction="column">
											<ModalHeader p="0">Why pay to Relay?</ModalHeader>
											Since there is a cost involved in publishing to the relay,
											you won't be subject to spammers and bots, thus getting
											better global feeds, search pages and reply sections. Plus
											you get a reliable server to store all your profile data,
											notes and events for others to discover from.
											{/* */}
											<ModalHeader px="0" py="4">
												Pay Here:
											</ModalHeader>
											{tabIndex === 1 &&
												(paymentDetailsRef.current ? (
													<>
														<ZapModalContents
															// @ts-ignore
															address={paymentDetailsRef.current.address}
															// @ts-ignore
															amount={paymentDetailsRef.current.amount}
														/>
														<ModalHeader px="0" pb="0" pt="4">
															Waiting for payment... <Spinner />
														</ModalHeader>
													</>
												) : (
													<Spinner
														ml="auto"
														mr="auto"
														mt="8"
														mb="8"
														flexShrink={0}
													/>
												))}
										</Flex>
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

import { hidePaywall } from "../../../services/paywall";
import {
	Button,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
} from "@chakra-ui/react";
import { unixNow } from "applesauce-core/helpers";
import { PAYWALL_MESSAGE } from "../../../env";
import SupportButton from "~/components/support-button";
import { useEffect, useState } from "react";

export default function SupportPaywall() {
	const [isOpen, setIsOpen] = useState(
		hidePaywall.value ? hidePaywall.value < unixNow() : false,
	);
	const dismiss = () => {
		// Hide for a week on dismiss
		// False by default if initial load
		hidePaywall.next(unixNow() + 60 * 60 * 24 * 7);
		setIsOpen(false);
	};

	useEffect(() => {
		if (hidePaywall.value === null) {
			// Hide for a day on first load
			hidePaywall.next(unixNow() + 10);
		}
	}, []);

	return (
		<Modal
			isOpen={isOpen}
			onClose={dismiss}
			size="lg"
			closeOnOverlayClick={false}
		>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>Support the app</ModalHeader>
				<ModalBody>
					{PAYWALL_MESSAGE ||
						"If you are enjoying this app, consider supporting the developer! Every little bit helps. Thanks!"}
				</ModalBody>

				<ModalFooter gap="2">
					<Button variant="link" px="4" py="2" onClick={dismiss}>
						Dismiss for now
					</Button>

					<SupportButton />
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

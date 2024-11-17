import { Button, Flex } from "@chakra-ui/react";

import useAppSettings from "../../hooks/use-app-settings";
import Monero from "../icons/monero";

export default function CustomZapAmountOptions({
	onSelect,
}: { onSelect: (value: number) => void }) {
	const { customZapAmounts } = useAppSettings();

	return (
		<Flex gap="2" alignItems="center" wrap="wrap">
			{customZapAmounts
				.split(",")
				.map((v) => Number.parseFloat(v))
				.map((amount) => (
					<Button
						key={amount}
						onClick={() => onSelect(amount)}
						leftIcon={<Monero />}
						variant="solid"
						size="sm"
            isDisabled={false}
					>
						{amount}
					</Button>
				))}
		</Flex>
	);
}

import { useCallback, useState } from "react";
import {
	Button,
	Flex,
	FlexProps,
	NumberDecrementStepper,
	NumberIncrementStepper,
	NumberInput,
	NumberInputField,
	NumberInputStepper,
	Popover,
	PopoverArrow,
	PopoverBody,
	PopoverCloseButton,
	PopoverContent,
	PopoverHeader,
	PopoverTrigger,
	Spinner,
	Text,
} from "@chakra-ui/react";
import { useInterval } from "react-use";

import { parsePaymentRequest } from "../../../helpers/bolt11";
import { V4VStreamIcon, V4VStopIcon } from "../../../components/icons";

export default function StreamSatsPerMinute({
	pubkey,
	...props
}: { pubkey: string } & FlexProps) {
	const [enabled, setEnabled] = useState(false);
	const [paying, setPaying] = useState(false);
	const [amountStr, setAmountStr] = useState("4");

	const isAvailable = true;
	const isEnabled = isAvailable && enabled;

	return (
		<Flex gap="2">
			<Popover>
				<PopoverTrigger>
					<Button rightIcon={isEnabled ? <Spinner size="sm" /> : undefined}>
						Stream sats
					</Button>
				</PopoverTrigger>
				<PopoverContent>
					<PopoverArrow />
					<PopoverCloseButton />
					<PopoverHeader>Stream {amountStr} sats per minute</PopoverHeader>
					<PopoverBody>
						{isAvailable ? (
							<Flex gap="2">
								<NumberInput
									step={1}
									min={1}
									value={amountStr}
									onChange={(v) => setAmountStr(v)}
									isDisabled={!isAvailable}
								>
									<NumberInputField />
									<NumberInputStepper>
										<NumberIncrementStepper />
										<NumberDecrementStepper />
									</NumberInputStepper>
								</NumberInput>
								<Button
									leftIcon={isEnabled ? <V4VStopIcon /> : <V4VStreamIcon />}
									onClick={() => setEnabled((v) => !v)}
									isDisabled={!isAvailable}
								>
									{isEnabled ? "Stop" : "Start"}
								</Button>
							</Flex>
						) : (
							<Text colorScheme="orange">Missing WebLN</Text>
						)}
					</PopoverBody>
				</PopoverContent>
			</Popover>
		</Flex>
	);
}

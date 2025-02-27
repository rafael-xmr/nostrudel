import { Box, Button, Flex, Input, Text } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import type { NostrEvent } from "../../types/nostr-event";
import useUserXMRMetadata from "~/hooks/use-user-xmr-metadata";
import { EmbedEvent, type EmbedProps } from "../embed-event";
import useAppSettings from "../../hooks/use-user-app-settings";
import CustomZapAmountOptions from "./zap-options";
import UserAvatar from "../user/user-avatar";
import UserLink from "../user/user-link";
import Monero from "../icons/monero";
import { InvoiceModalContent } from "../invoice-modal";

function UserCard({ pubkey, percent }: { pubkey: string; percent?: number }) {
	const { address } = useUserXMRMetadata(pubkey);

	return (
		<Flex gap="2" alignItems="center" overflow="hidden">
			<UserAvatar pubkey={pubkey} size="md" />
			<Box overflow="hidden">
				<UserLink pubkey={pubkey} fontWeight="bold" />
				<Text isTruncated>{address}</Text>
			</Box>
			{percent && (
				<Text fontWeight="bold" fontSize="lg" ml="auto">
					{Math.round(percent * 10000) / 100}%
				</Text>
			)}
		</Flex>
	);
}

export type InputStepProps = {
	pubkey?: string;
	event?: NostrEvent;
	initialComment?: string;
	initialAmount?: number;
	defaultAmount?: number;
	allowComment?: boolean;
	showEmbed?: boolean;
	embedProps?: EmbedProps;
	address?: string;
};

export default function InputStep({
	event,
	initialComment,
	initialAmount,
	defaultAmount,
	showEmbed = true,
	embedProps,
	address,
}: InputStepProps) {
	const { customZapAmounts } = useAppSettings();

	const {
		register,
		watch,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<{
		amount: number;
		comment: string;
	}>({
		mode: "onBlur",
		defaultValues: {
			amount:
				defaultAmount ??
				initialAmount ??
				(Number.parseFloat(customZapAmounts.split(",")[0]) || 100),
			comment: initialComment ?? "",
		},
	});

	const minTip = 0.0005;

	// TODO
	const showComment = false;
	// const showComment = allowComment && splits.length > 0;
	// const actionName = canZap ? "Zap" : "Tip";

	return (
		<Flex gap="4" direction="column">
			{showEmbed && event && <EmbedEvent event={event} {...embedProps} />}

			{showComment && (
				<Input
					placeholder="Comment"
					{...register("comment", { maxLength: 150 })}
					autoComplete="off"
				/>
			)}

			<InvoiceModalContent
				address={address}
				amount={watch("amount")}
				onPaid={() => {}}
			/>

			{defaultAmount ? null : (
				<>
					<CustomZapAmountOptions
						onSelect={(amount) =>
							setValue("amount", amount, { shouldDirty: true })
						}
					/>

					<Flex gap="2">
						<Input
							type="number"
							placeholder="Custom amount"
							isInvalid={!!errors.amount}
							step={0.0001}
							min={minTip}
							flex={1}
							{...register("amount", {
								valueAsNumber: true,
								min: 0.0001,
								onBlur: () => {
									const amount = watch("amount");
									if (Number.isNaN(amount)) {
										setValue("amount", 0);
									} else {
										setValue("amount", amount);
									}
								},
							})}
						/>
					</Flex>
				</>
			)}
		</Flex>
	);
}

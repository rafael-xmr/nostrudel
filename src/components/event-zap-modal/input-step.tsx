import { Box, Button, Flex, Input, Text } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import type { NostrEvent } from "../../types/nostr-event";
import useUserXMRMetadata from "../../hooks/use-user-xmr-metadata";
import { getZapSplits } from "../../helpers/nostr/zaps";
import { EmbedEvent, type EmbedProps } from "../embed-event";
import useAppSettings from "../../hooks/use-app-settings";
import CustomZapAmountOptions from "./zap-options";
import UserAvatar from "../user/user-avatar";
import UserLink from "../user/user-link";
import Monero from "../icons/monero";

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
	pubkey: string;
	event?: NostrEvent;
	initialComment?: string;
	initialAmount?: number;
	allowComment?: boolean;
	showEmbed?: boolean;
	embedProps?: EmbedProps;
	onSubmit: (values: { amount: number; comment: string }) => void;
};

export default function InputStep({
	event,
	pubkey,
	initialComment,
	initialAmount,
	allowComment = true,
	showEmbed = true,
	embedProps,
	onSubmit,
}: InputStepProps) {
	const { customZapAmounts } = useAppSettings();

	const {
		register,
		handleSubmit,
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
				initialAmount ??
				(Number.parseFloat(customZapAmounts.split(",")[0]) || 100),
			comment: initialComment ?? "",
		},
	});

	const splits = event ? getZapSplits(event, pubkey) : [];
	const minTip = 0.0005;

  // TODO
	const showComment = false;
	// const showComment = allowComment && splits.length > 0;
	// const actionName = canZap ? "Zap" : "Tip";

	const onSubmitZap = handleSubmit(onSubmit);

	return (
		<form onSubmit={onSubmitZap}>
			<Flex gap="4" direction="column">
				{splits.map((p) => (
					<UserCard key={p.pubkey} pubkey={p.pubkey} percent={p.percent} />
				))}

				{showEmbed && event && <EmbedEvent event={event} {...embedProps} />}

				{showComment && (
					<Input
						placeholder="Comment"
						{...register("comment", { maxLength: 150 })}
						autoComplete="off"
					/>
				)}

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
					<Button
						leftIcon={<Monero />}
						type="submit"
						isLoading={isSubmitting}
						variant="solid"
						size="md"
						autoFocus
						isDisabled={false}
					>
						Tip {Number.isNaN(watch("amount")) ? 0 : watch("amount")} XMR
					</Button>
				</Flex>
			</Flex>
		</form>
	);
}

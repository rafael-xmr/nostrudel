import { useMemo, useRef, useState } from "react";
import {
	Box,
	Button,
	ButtonGroup,
	Flex,
	FormControl,
	FormHelperText,
	FormLabel,
	Input,
	Slider,
	SliderFilledTrack,
	SliderThumb,
	SliderTrack,
	Switch,
	Link,
	useDisclosure,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useAsync, useThrottle } from "react-use";
import type { ThreadItem } from "applesauce-core/queries";
import { useEventFactory } from "applesauce-react/hooks";
import type { Emoji } from "applesauce-core/helpers";

import type { NostrEvent } from "../../../types/nostr-event";
import MagicTextArea, {
	type RefType,
} from "../../../components/magic-textarea";
import { useContextEmojis } from "../../../providers/global/emoji-provider";
import { TrustProvider } from "../../../providers/local/trust-provider";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { TextNoteContents } from "../../../components/note/timeline-note/text-note-contents";
import useCacheForm from "../../../hooks/use-cache-form";
import useTextAreaUploadFile, {
	useTextAreaInsertTextWithForm,
} from "../../../hooks/use-textarea-upload-file";
import InsertGifButton from "../../../components/gif/insert-gif-button";
import InsertImageButton from "../../new/note/insert-image-button";
import InsertReactionButton from "../../../components/reactions/insert-reaction-button";
import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";
import useAppSettings from "~/hooks/use-user-app-settings";
import MinePOW from "~/components/pow/mine-pow";
import type { UnsignedEvent } from "nostr-tools";

export type ReplyFormProps = {
	item: ThreadItem;
	replyKind?: number;
	onCancel?: () => void;
	onSubmitted?: (event: NostrEvent) => void;
};

export default function ReplyForm({
	item,
	onCancel,
	onSubmitted,
}: ReplyFormProps) {
	const publish = usePublishEvent();
	const factory = useEventFactory();
	const emojis = useContextEmojis();
	const advanced = useDisclosure();
	const customEmojis = useMemo(
		() => emojis.filter((e) => !!e.url) as Emoji[],
		[emojis],
	);

	const { noteDifficulty } = useAppSettings();
	const [miningTarget, setMiningTarget] = useState(0);
	const [draft, setDraft] = useState<UnsignedEvent>();

	const getDraft = async (values = getValues()) => {
		// build draft using factory
		const draft = await factory.noteReply(item.event, values.content, {
			emojis: customEmojis,
			contentWarning: values.nsfw ? values.nsfwReason || values.nsfw : false,
		});

		const unsigned = await factory.stamp(draft);
		setDraft(unsigned);
		return unsigned;
	};

	const {
		setValue,
		getValues,
		watch,
		handleSubmit,
		formState,
		reset,
		register,
	} = useForm({
		defaultValues: {
			content: "",
			nsfw: false,
			nsfwReason: "",
			difficulty: noteDifficulty || 0,
		},
		mode: "all",
	});

	const clearCache = useCacheForm<{
		content: string;
		nsfw: boolean;
		nsfwReason: string;
		difficulty: number;
	}>(`reply-${item.event.id}`, getValues, reset, formState);

	watch("content");

	const textAreaRef = useRef<RefType | null>(null);
	const insertText = useTextAreaInsertTextWithForm(
		textAreaRef,
		getValues,
		setValue,
	);
	const { onPaste } = useTextAreaUploadFile(insertText);

	const publishReply = async (unsigned?: UnsignedEvent) => {
		const toPublish = unsigned || draft || (await getDraft());
		const pub = await publish("Reply", toPublish);

		setDraft(undefined);

		if (pub && onSubmitted) onSubmitted(pub.event);
		clearCache();
	};

	const submit = handleSubmit(async (values) => {
		if (values.difficulty > 0) {
			setMiningTarget(values.difficulty);
		} else {
			const unsigned = await getDraft(values);
			await publishReply(unsigned);
		}

		reset();
	});

	const formRef = useRef<HTMLFormElement | null>(null);

	const { value: preview } = useAsync(() => getDraft(), [getValues().content]);

	const showAdvanced = advanced.isOpen || formState.dirtyFields.nsfw;

	if (miningTarget && draft) {
		return (
			<MinePOW
				draft={draft}
				targetPOW={miningTarget}
				onCancel={() => setMiningTarget(0)}
				onSkip={publishReply}
				onComplete={publishReply}
			/>
		);
	}

	return (
		<Flex
			as="form"
			direction="column"
			gap="2"
			pb="4"
			onSubmit={submit}
			ref={formRef}
		>
			<MagicTextArea
				placeholder="Reply"
				autoFocus
				mb="2"
				rows={4}
				isRequired
				value={getValues().content}
				onChange={(e) =>
					setValue("content", e.target.value, { shouldDirty: true })
				}
				instanceRef={(inst) => {
					textAreaRef.current = inst;
				}}
				onPaste={onPaste}
				onKeyDown={(e) => {
					if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && formRef.current)
						formRef.current.requestSubmit();
				}}
			/>
			<Flex gap="2" alignItems="center">
				<ButtonGroup size="sm">
					<InsertImageButton
						onUploaded={insertText}
						aria-label="Upload image"
					/>
					<InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
					<InsertReactionButton onSelect={insertText} aria-label="Add emoji" />
					<Button
						variant="link"
						rightIcon={
							advanced.isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />
						}
						onClick={advanced.onToggle}
					>
						More
					</Button>
				</ButtonGroup>
				<ButtonGroup size="sm" ml="auto">
					{onCancel && <Button onClick={onCancel}>Cancel</Button>}
					<Button type="submit" colorScheme="primary" size="sm">
						Submit
					</Button>
				</ButtonGroup>
			</Flex>

			{showAdvanced && (
				<Flex direction={{ base: "column", lg: "row" }} gap="4">
					<Flex direction="column" gap="2" flex={1}>
						<Flex gap="2" direction="column">
							<Switch {...register("nsfw")}>NSFW</Switch>
							{getValues().nsfw && (
								<Input
									{...register("nsfwReason", { required: true })}
									placeholder="Reason"
									isRequired
								/>
							)}
						</Flex>
						<FormControl>
							<FormLabel>POW Difficulty ({getValues("difficulty")})</FormLabel>
							<Slider
								aria-label="difficulty"
								value={getValues("difficulty")}
								onChange={(v) =>
									setValue("difficulty", v, {
										shouldDirty: true,
										shouldTouch: true,
									})
								}
								min={0}
								max={40}
								step={1}
							>
								<SliderTrack>
									<SliderFilledTrack />
								</SliderTrack>
								<SliderThumb />
							</Slider>
							<FormHelperText>
								The number of leading 0's in the event id. see{" "}
								<Link
									href="https://github.com/nostr-protocol/nips/blob/master/13.md"
									isExternal
								>
									NIP-13
								</Link>
							</FormHelperText>
						</FormControl>
					</Flex>
				</Flex>
			)}
			{preview && preview.content.length > 0 && (
				<Box p="2" borderWidth={1} borderRadius="md" mb="2">
					<TrustProvider trust>
						<TextNoteContents event={preview} />
					</TrustProvider>
				</Box>
			)}
		</Flex>
	);
}

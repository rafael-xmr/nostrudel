import { useRef, useState } from "react";
import {
	Flex,
	Button,
	Box,
	Heading,
	useDisclosure,
	Input,
	Switch,
	FormLabel,
	FormControl,
	FormHelperText,
	Link,
	Slider,
	SliderTrack,
	SliderFilledTrack,
	SliderThumb,
	type FlexProps,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import type { UnsignedEvent } from "nostr-tools";
import { useAsync, useThrottle } from "react-use";
import { useEventFactory } from "applesauce-react/hooks";
import {
	type Emoji,
	getEventPointerFromQTag,
	processTags,
} from "applesauce-core/helpers";

import {
	type PublishLogEntry,
	useFinalizeDraft,
	usePublishEvent,
} from "../../../providers/global/publish-provider";
import useAppSettings from "../../../hooks/use-user-app-settings";
import { useContextEmojis } from "../../../providers/global/emoji-provider";
import useCacheForm from "../../../hooks/use-cache-form";
import MagicTextArea, {
	type RefType,
} from "../../../components/magic-textarea";
import useTextAreaUploadFile, {
	useTextAreaInsertTextWithForm,
} from "../../../hooks/use-textarea-upload-file";
import { ErrorBoundary } from "../../../components/error-boundary";
import { TrustProvider } from "../../../providers/local/trust-provider";
import TextNoteContents from "../../../components/note/timeline-note/text-note-contents";
import InsertImageButton from "./insert-image-button";
import InsertGifButton from "../../../components/gif/insert-gif-button";
import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";
import MinePOW from "../../../components/pow/mine-pow";
import { PublishLogEntryDetails } from "../../task-manager/publish-log/entry-details";
import InsertReactionButton from "../../../components/reactions/insert-reaction-button";
import { eventStore } from "../../../services/event-store";

type FormValues = {
	content: string;
	nsfw: boolean;
	nsfwReason: string;
	difficulty: number;
};

export type ShortTextNoteFormProps = {
	cacheFormKey?: string | null;
	initContent?: string;
};

export default function ShortTextNoteForm({
	cacheFormKey = "new-note",
	initContent = "",
}: Omit<FlexProps, "children"> & ShortTextNoteFormProps) {
	const publish = usePublishEvent();
	const finalizeDraft = useFinalizeDraft();
	const { noteDifficulty } = useAppSettings();
	const [miningTarget, setMiningTarget] = useState(0);
	const [published, setPublished] = useState<PublishLogEntry>();
	const emojis = useContextEmojis();
	const advanced = useDisclosure();

	const factory = useEventFactory();
	const [draft, setDraft] = useState<UnsignedEvent>();
	const {
		getValues,
		setValue,
		watch,
		register,
		handleSubmit,
		formState,
		reset,
	} = useForm<FormValues>({
		defaultValues: {
			content: initContent,
			nsfw: false,
			nsfwReason: "",
			difficulty: noteDifficulty || 0,
		},
		mode: "all",
	});

	// watch form state
	formState.isDirty;
	watch("content");
	watch("nsfw");
	watch("nsfwReason");
	watch("difficulty");

	// cache form to localStorage
	useCacheForm<FormValues>(cacheFormKey, getValues, reset, formState);

	const getDraft = async (values = getValues()) => {
		// build draft using factory
		const draft = await factory.note(values.content, {
			emojis: emojis.filter((e) => !!e.url) as Emoji[],
			contentWarning: values.nsfw ? values.nsfwReason || values.nsfw : false,
		});

		const unsigned = await factory.stamp(draft);

		setDraft(unsigned);
		return unsigned;
	};

	const { value: preview } = useAsync(() => getDraft(), [getValues().content]);

	const textAreaRef = useRef<RefType | null>(null);
	const insertText = useTextAreaInsertTextWithForm(
		textAreaRef,
		getValues,
		setValue,
	);
	const { onPaste } = useTextAreaUploadFile(insertText);

	const publishPost = async (unsigned?: UnsignedEvent) => {
		const toPublish = unsigned || draft || (await getDraft());

		// mirror quoted events
		const pointers = processTags(toPublish.tags, (t) =>
			t[0] === "q" ? getEventPointerFromQTag(t) : undefined,
		);
		const events = pointers
			.map((p) => eventStore.getEvent(p.id))
			.filter((t) => !!t);
		for (const event of events) publish("Broadcast event", event);

		const pub = await publish("Post", toPublish);
		if (pub) setPublished(pub);
	};
	const submit = handleSubmit(async (values) => {
		if (values.difficulty > 0) {
			setMiningTarget(values.difficulty);
		} else {
			publishPost(await getDraft(values));
		}

		reset();
	});

	const canSubmit = getValues().content.length > 0;

	if (published) {
		return (
			<Flex direction="column" gap="2">
				<PublishLogEntryDetails entry={published} />
			</Flex>
		);
	}

	if (miningTarget && draft) {
		return (
			<Flex direction="column" gap="2">
				<MinePOW
					draft={draft}
					targetPOW={miningTarget}
					onCancel={() => setMiningTarget(0)}
					onSkip={publishPost}
					onComplete={publishPost}
				/>
			</Flex>
		);
	}

	const showAdvanced =
		advanced.isOpen ||
		formState.dirtyFields.difficulty ||
		formState.dirtyFields.nsfw;

	return (
		<>
			<Flex direction="column" gap="2">
				<MagicTextArea
					autoFocus
					mb="2"
					value={getValues().content}
					onChange={(e) =>
						setValue("content", e.target.value, {
							shouldDirty: true,
							shouldTouch: true,
						})
					}
					rows={8}
					isRequired
					instanceRef={(inst) => {
						textAreaRef.current = inst;
					}}
					onPaste={onPaste}
					onKeyDown={(e) => {
						if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submit();
					}}
				/>
				{preview && preview.content.length > 0 && (
					<Box>
						<Heading size="sm">Preview:</Heading>
						<Box borderWidth={1} borderRadius="md" p="2">
							<ErrorBoundary>
								<TrustProvider trust>
									<TextNoteContents event={preview} />
								</TrustProvider>
							</ErrorBoundary>
						</Box>
					</Box>
				)}
				<Flex gap="2" alignItems="center" justifyContent="flex-end">
					<Flex mr="auto" gap="2">
						<InsertImageButton
							onUploaded={insertText}
							aria-label="Upload image"
						/>
						<InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
						<InsertReactionButton
							onSelect={insertText}
							aria-label="Add emoji"
						/>
					</Flex>
				</Flex>
				<Flex gap="2" alignItems="center" justifyContent="space-between">
					<Button
						variant="link"
						rightIcon={
							advanced.isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />
						}
						onClick={advanced.onToggle}
					>
						More Options
					</Button>
					{formState.isDirty && (
						<Button
							variant="ghost"
							onClick={() => confirm("Clear draft?") && reset()}
							ms="auto"
						>
							Clear
						</Button>
					)}
					<Button
						colorScheme="primary"
						type="submit"
						isLoading={formState.isSubmitting}
						onClick={submit}
						isDisabled={!canSubmit}
					>
						Post
					</Button>
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
								<FormLabel>
									POW Difficulty ({getValues("difficulty")})
								</FormLabel>
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
			</Flex>
		</>
	);
}

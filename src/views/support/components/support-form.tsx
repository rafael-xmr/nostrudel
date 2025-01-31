import { useEffect, useMemo, useRef } from "react";
import {
	Box,
	Button,
	ButtonGroup,
	Flex,
	FlexProps,
	Input,
	useDisclosure,
	useToast,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { EventTemplate, kinds } from "nostr-tools";
import { unixNow } from "applesauce-core/helpers";

import MagicTextArea, { RefType } from "../../../components/magic-textarea";
import useTextAreaUploadFile, {
	useTextAreaInsertTextWithForm,
} from "../../../hooks/use-textarea-upload-file";
import { LightningIcon } from "../../../components/icons";
import InsertImageButton from "../../new/note/insert-image-button";
import InsertGifButton from "../../../components/gif/insert-gif-button";
import TextNoteContents from "../../../components/note/timeline-note/text-note-contents";
import { TrustProvider } from "../../../providers/local/trust-provider";
import type { PayRequest } from "../../../components/event-zap-modal";
import { SUPPORT_PUBKEY } from "../../../const";
import { useUserInbox } from "../../../hooks/use-user-mailboxes";
import useUserProfile from "../../../hooks/use-user-profile";

export default function SupportForm({
	onSubmit,
	...props
}: Omit<FlexProps, "children" | "onSubmit"> & {
	onSubmit: (request: PayRequest) => void;
}) {
	const preview = useDisclosure();
	const toast = useToast();
	const { getValues, setValue, register, handleSubmit, watch, formState } =
		useForm({
			defaultValues: { content: "", amount: 1000 },
			mode: "all",
		});
	watch("content");

	const textAreaRef = useRef<RefType | null>(null);
	const insertText = useTextAreaInsertTextWithForm(
		textAreaRef,
		getValues,
		setValue,
	);
	const { onPaste } = useTextAreaUploadFile(insertText);

	// load required data
	useUserInbox(SUPPORT_PUBKEY);
	useUserProfile(SUPPORT_PUBKEY);

	const submit = handleSubmit(async (values) => {});

	const previewEvent = useMemo<EventTemplate>(
		() => ({
			content: getValues("content"),
			kind: kinds.ZapRequest,
			tags: [],
			created_at: unixNow(),
		}),
		[getValues("content")],
	);

	return (
		<Flex
			as="form"
			direction="column"
			gap="2"
			onSubmit={submit}
			flexShrink={0}
			{...props}
		>
			{preview.isOpen ? (
				<TrustProvider trust>
					<Box py="2" px="4" borderWidth={1} rounded="md">
						<TextNoteContents event={previewEvent} minH="16" />
					</Box>
				</TrustProvider>
			) : (
				<MagicTextArea
					value={getValues().content}
					onChange={(e) =>
						setValue("content", e.target.value, {
							shouldDirty: true,
							shouldTouch: true,
						})
					}
					rows={3}
					instanceRef={(inst) => (textAreaRef.current = inst)}
					onPaste={onPaste}
				/>
			)}
			<Flex>
				<ButtonGroup>
					<InsertImageButton
						onUploaded={insertText}
						aria-label="Upload image"
					/>
					<InsertGifButton onSelectURL={insertText} aria-label="Add gif" />
				</ButtonGroup>
				<ButtonGroup ml="auto">
					<Button variant="link" px="2" onClick={preview.onToggle}>
						Preview
					</Button>
					<Button
						colorScheme="primary"
						leftIcon={<LightningIcon />}
						type="submit"
						isLoading={formState.isSubmitting}
					>
						Zap
					</Button>
				</ButtonGroup>
			</Flex>
		</Flex>
	);
}

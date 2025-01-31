import { Link as RouterLink } from "react-router-dom";
import {
	Flex,
	FormControl,
	FormLabel,
	Switch,
	FormHelperText,
	Input,
	Select,
	Textarea,
	Link,
	Button,
} from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import localSettings from "../../../services/local-settings";
import useSettingsForm from "../use-settings-form";
import SimpleView from "../../../components/layout/presets/simple-view";

export default function DisplaySettings() {
	const { register, submit, formState } = useSettingsForm();

	const hideZapBubbles = useObservable(localSettings.hideZapBubbles);

	return (
		<SimpleView
			title="Display"
			as="form"
			onSubmit={submit}
			gap="4"
			actions={
				<Button
					ml="auto"
					isLoading={
						formState.isLoading ||
						formState.isValidating ||
						formState.isSubmitting
					}
					isDisabled={!formState.isDirty}
					colorScheme="primary"
					type="submit"
					flexShrink={0}
					size="sm"
				>
					Save
				</Button>
			}
		>
			<FormControl>
				<Flex alignItems="center">
					<FormLabel htmlFor="blurImages" mb="0">
						Blur media from strangers
					</FormLabel>
					<Switch id="blurImages" {...register("blurImages")} />
				</Flex>
				<FormHelperText>
					<span>Enabled: blur media from people you aren't following</span>
				</FormHelperText>
			</FormControl>
			<FormControl>
				<Flex alignItems="center">
					<FormLabel htmlFor="hideUsernames" mb="0">
						Hide usernames (anon mode)
					</FormLabel>
					<Switch id="hideUsernames" {...register("hideUsernames")} />
				</Flex>
				<FormHelperText>
					<span>
						Enabled: hides usernames and pictures.{" "}
						<Link
							as={RouterLink}
							color="blue.500"
							to="/n/nevent1qqsxvkjgpc6zhydj4rxjpl0frev7hmgynruq027mujdgy2hwjypaqfspzpmhxue69uhkummnw3ezuamfdejszythwden5te0dehhxarjw4jjucm0d5sfntd0"
						>
							Details
						</Link>
					</span>
				</FormHelperText>
			</FormControl>
			<FormControl>
				<Flex alignItems="center">
					<FormLabel htmlFor="removeEmojisInUsernames" mb="0">
						Hide Emojis in usernames
					</FormLabel>
					<Switch
						id="removeEmojisInUsernames"
						{...register("removeEmojisInUsernames")}
					/>
				</Flex>
				<FormHelperText>
					<span>
						Enabled: Removes all emojis in other users usernames and display
						names
					</span>
				</FormHelperText>
			</FormControl>
			<FormControl>
				<Flex alignItems="center">
					<FormLabel htmlFor="hideZapBubbles" mb="0">
						Hide individual zaps on notes
					</FormLabel>
					<Switch
						id="hideZapBubbles"
						isChecked={hideZapBubbles}
						onChange={() =>
							localSettings.hideZapBubbles.next(
								!localSettings.hideZapBubbles.value,
							)
						}
					/>
				</Flex>
				<FormHelperText>
					<span>Enabled: Hides individual zaps on notes in the timeline</span>
				</FormHelperText>
			</FormControl>
			<FormControl>
				<Flex alignItems="center">
					<FormLabel htmlFor="show-content-warning" mb="0">
						Show content warning
					</FormLabel>
					<Switch
						id="show-content-warning"
						{...register("showContentWarning")}
					/>
				</Flex>
				<FormHelperText>
					<span>
						Enabled: shows a warning for notes with NIP-36 Content Warning
					</span>
				</FormHelperText>
			</FormControl>
			<FormControl>
				<FormLabel htmlFor="muted-words" mb="0">
					Muted words
				</FormLabel>
				<Textarea
					id="muted-words"
					{...register("mutedWords")}
					placeholder="Broccoli, Spinach, Artichoke..."
					maxW="2xl"
				/>
				<FormHelperText>
					<span>
						Comma separated list of words, phrases or hashtags you never want to
						see in notes. (case insensitive)
					</span>
					<br />
					<span>
						Be careful its easy to hide all notes if you add common words.
					</span>
				</FormHelperText>
			</FormControl>
		</SimpleView>
	);
}

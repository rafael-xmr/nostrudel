import {
	Flex,
	FormControl,
	FormLabel,
	FormHelperText,
	Input,
	FormErrorMessage,
	Heading,
	Button,
} from "@chakra-ui/react";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import useSettingsForm from "../use-settings-form";

export default function MoneroSettings() {
	const { register, submit, formState } = useSettingsForm();

	return (
		<VerticalPageLayout as="form" onSubmit={submit} flex={1}>
			<Heading size="md">Monero Settings</Heading>
			<Flex direction="column" gap="4">
				<FormControl>
					<FormLabel htmlFor="customZapAmounts" mb="0">
						Tipping Amounts
					</FormLabel>
					<Input
						id="customZapAmounts"
						maxW="sm"
						autoComplete="off"
						{...register("customZapAmounts", {
							validate: (v) => {
								if (!/^[\d,]*$/.test(v))
									return "Must be a list of comma separated numbers";
								return true;
							},
						})}
					/>
					{formState.errors.customZapAmounts && (
						<FormErrorMessage>
							{formState.errors.customZapAmounts.message}
						</FormErrorMessage>
					)}
					<FormHelperText>
						<span>Comma separated list of quick amounts for tipping other users</span>
					</FormHelperText>
				</FormControl>
			</Flex>
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
			>
				Save Settings
			</Button>
		</VerticalPageLayout>
	);
}

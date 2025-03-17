import { useEffect } from "react";
import {
	Button,
	Flex,
	FormControl,
	FormHelperText,
	FormLabel,
	Heading,
	Input,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useObservable } from "applesauce-react/hooks";

import NtfyNotificationSettings from "./ntfy";
import OtherSubscriptions from "./other";
import WebPushNotificationSettings from "./web-push";
import SimpleView from "../../../../components/layout/presets/simple-view";
import { CAP_IS_NATIVE, CAP_IS_WEB } from "../../../../env";
import { useBakeryProvider } from "~/providers/global/bakery-provider";

function EmailForm() {
	const { controlApi$ } = useBakeryProvider();
	const controlApi = useObservable(controlApi$);
	const config = useObservable(controlApi?.config);
	const { register, handleSubmit, reset } = useForm({
		defaultValues: { email: config?.notificationEmail ?? "" },
		mode: "all",
	});

	useEffect(() => {
		if (config) reset({ email: config.notificationEmail });
	}, [config]);

	const submit = handleSubmit((values) => {
		controlApi?.setConfigField("notificationEmail", values.email);
	});

	return (
		<Flex direction="column" as="form" onSubmit={submit}>
			<Heading size="sm">Email Notifications</Heading>
			<FormControl>
				<FormLabel>Email address</FormLabel>
				<Flex gap="2">
					<Input type="email" {...register("email")} />
					<Button colorScheme="green" type="submit">
						Save
					</Button>
				</Flex>
				<FormHelperText>
					Email is sent to the ntfy.sh server for forwarding notifications
				</FormHelperText>
			</FormControl>
		</Flex>
	);
}

export default function NotificationSettingsView() {
	return (
		<SimpleView title="Notifications" maxW="4xl" gap="4">
			{(CAP_IS_WEB || process.env.NEXT_PUBLIC_DEV) && (
				<WebPushNotificationSettings />
			)}
			{(CAP_IS_NATIVE || process.env.NEXT_PUBLIC_DEV) && (
				<NtfyNotificationSettings />
			)}
			<OtherSubscriptions />
		</SimpleView>
	);
}

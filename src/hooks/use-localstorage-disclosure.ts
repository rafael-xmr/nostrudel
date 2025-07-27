import { useDisclosure } from "@chakra-ui/react";
import * as reactUse from "react-use";

export default function useLocalStorageDisclosure(
	name: string,
	defaultIsOpen?: boolean,
) {
	const [value, setValue] = reactUse.useLocalStorage<boolean>(
		name,
		defaultIsOpen,
	);

	return useDisclosure({
		isOpen: value,
		onOpen: () => setValue(true),
		onClose: () => setValue(false),
		defaultIsOpen: value,
	});
}

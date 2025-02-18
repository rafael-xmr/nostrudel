import {
	Menu,
	MenuButton,
	MenuList,
	IconButton,
	Portal,
	type MenuListProps,
	type IconButtonProps,
} from "@chakra-ui/react";
import { MoreIcon } from "./icons";

export type MenuIconButtonProps = IconButtonProps & {
	children: MenuListProps["children"];
};

export function DotsMenuButton({
	children,
	icon,
	...props
}: MenuIconButtonProps) {
	return (
		<Menu isLazy>
			<MenuButton as={IconButton} icon={icon || <MoreIcon />} {...props} />
			<Portal>
				<MenuList>{children}</MenuList>
			</Portal>
		</Menu>
	);
}

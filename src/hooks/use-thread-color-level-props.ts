import { useColorMode } from "@chakra-ui/react";

const LEVEL_COLORS = [
	"green",
	"blue",
	"red",
	"purple",
	"yellow",
	"cyan",
	"pink",
];
export default function useThreadColorLevelProps(level = -1, focused = false) {
	const color = LEVEL_COLORS[level % LEVEL_COLORS.length];
	const colorValue = 800;
	const focusColor = "blue.700";

	return {
		borderColor: focused ? focusColor : undefined,
		borderLeftColor: color + "." + colorValue,
	};
}

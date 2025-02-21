import { type PropsWithChildren, type ReactNode, Suspense } from "react";
import { Outlet, type OutletProps, useMatch } from "react-router-dom";
import { Box, Flex, type FlexProps, Spinner } from "@chakra-ui/react";

import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import SimpleHeader from "./simple-header";
import { ErrorBoundary } from "../../error-boundary";
import useScrollRestoreRef from "../../../hooks/use-scroll-restore";

export default function SimpleParentView({
	children,
	path,
	title,
	width = "xs",
	actions,
	padding = true,
	scroll = true,
	gap = 2,
	context,
}: PropsWithChildren<{
	path: string;
	title?: string;
	width?: "xs" | "sm" | "md";
	actions?: ReactNode;
	padding?: boolean;
	scroll?: boolean;
	gap?: FlexProps["gap"];
	context?: OutletProps["context"];
}>) {
	const match = useMatch(path);
	const isMobile = useBreakpointValue({ base: true, lg: false });
	const showMenu = !isMobile || !!match;

	const floating = useBreakpointValue({ base: false, lg: true });
	const ref = useScrollRestoreRef("parent");

	if (showMenu)
		return (
			<Flex
				data-type="parent-view"
				flex={1}
				direction={floating ? "row" : "column"}
			>
				{children && (
					<>
						<Box w={floating ? width : 0} flexGrow={0} flexShrink={0} />
						<Flex
							w={{ base: "full", lg: width }}
							direction="column"
							position={floating ? "fixed" : "initial"}
							top="var(--safe-top)"
							bottom="var(--safe-bottom)"
						>
							{title && <SimpleHeader title={title}>{actions}</SimpleHeader>}
							{scroll ? (
								<Flex
									direction="column"
									p={padding ? "2" : undefined}
									gap={gap}
									overflowY={scroll ? "auto" : "hidden"}
									overflowX="hidden"
									flex={1}
									ref={ref}
								>
									{children}
								</Flex>
							) : (
								<>{children}</>
							)}
						</Flex>
					</>
				)}
				{!isMobile && (
					<Suspense fallback={<Spinner />}>
						<ErrorBoundary>
							<Outlet context={context} />
						</ErrorBoundary>
					</Suspense>
				)}
			</Flex>
		);

	return (
		<Suspense fallback={<Spinner />}>
			<ErrorBoundary>
				<Outlet context={context} />
			</ErrorBoundary>
		</Suspense>
	);
}

import { drawSvgPath } from "../../helpers/qrcode";
import { Ecc, QrCode } from "../../lib/qrcodegen";
import { Box, type BoxProps } from "@chakra-ui/react";

export default function QrCodeSvg({
	content,
	lightColor = "white",
	darkColor = "black",
	border = 2,
	xmrIcon = false,
	...props
}: Omit<BoxProps, "children" | "border" | "content"> & {
	content: string;
	lightColor?: string;
	darkColor?: string;
	border?: number;
	xmrIcon?: boolean;
}) {
	const qrCode = QrCode.encodeText(content, Ecc.LOW);

	const qrCodeSize = qrCode.size + border * 2;

	const imageSize = qrCodeSize * 0.2;
	const imageX = (qrCodeSize - imageSize) / 2;
	const imageY = (qrCodeSize - imageSize) / 2;

	return (
		<Box
			as="svg"
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			version="1.1"
			viewBox={`0 0 ${qrCodeSize} ${qrCodeSize}`}
			stroke="none"
		>
			<title id="qr-code-title">qr</title>
			<defs>
				<linearGradient
					id="orangeToBlackGradient"
					x1="0%"
					y1="0%"
					x2="0%"
					y2="100%"
				>
					<stop offset="0%" style={{ stopColor: "#FF6600", stopOpacity: 1 }} />{" "}
					{/* Orange */}
					<stop
						offset="100%"
						style={{ stopColor: "#000000", stopOpacity: 1 }}
					/>{" "}
					{/* Black */}
				</linearGradient>
			</defs>
			<rect width="100%" height="100%" fill={lightColor} />
			<path
				d={drawSvgPath(qrCode, border)}
				fill="url(#orangeToBlackGradient)"
			/>
			{xmrIcon && (
				<image
					href={"/resized_image2.png"}
					x={imageX}
					y={imageY}
					width={imageSize}
					height={imageSize}
					clipPath="url(#clip)"
				/>
			)}
		</Box>
	);
}

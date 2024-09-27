import { useMemo } from "react";
import { drawSvgPath } from "../../helpers/qrcode";
import { Ecc, QrCode } from "../../lib/qrcodegen";

export default function QrCodeSvg({
	content,
	lightColor = "white",
	darkColor = "black",
	border = 2,
	xmrIcon = false,
}: {
	content: string;
	lightColor?: string;
	darkColor?: string;
	border?: number;
  xmrIcon?: boolean;
}) {
	const qrCode = useMemo(() => QrCode.encodeText(content, Ecc.LOW), [content]);

	const qrCodeSize = qrCode.size + border * 2;

	const imageSize = qrCodeSize * 0.2;
	const imageX = (qrCodeSize - imageSize) / 2;
	const imageY = (qrCodeSize - imageSize) / 2;

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			version="1.1"
			viewBox={`0 0 ${qrCodeSize} ${qrCodeSize}`}
			stroke="none"
		>
			<title id="qr-code-title">qr</title>
			<rect width="100%" height="100%" fill={lightColor} />
			<path d={drawSvgPath(qrCode, border)} fill={darkColor} />
			{xmrIcon && (
				<image
					href={"/xmr8bit.png"}
					x={imageX}
					y={imageY}
					width={imageSize}
					height={imageSize}
					clipPath="url(#clip)"
				/>
			)}
		</svg>
	);
}

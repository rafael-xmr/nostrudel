import { EMPTY, switchMap } from "rxjs";
import { fixOrientationAndStripMetadata } from "../lib/fix-image-orientation";
import { AppSettingsQuery } from "../models";
import type { AppSettings } from "./app-settings";

// Import management types
import type { AccountsManagement } from "../services/accounts";
import type { EventStoreManagement } from "../services/event-store";
import type { LoadersManagement } from "~/services/loaders";

export type ImageSize = { width: number; height: number };

export interface ImageUtilsManagement {
	getImageSize: (src: string) => Promise<ImageSize>;
	buildImageProxyURL: (
		src: string,
		size: string | number,
	) => string | undefined;
	stripSensitiveMetadataOnFile: (file: File) => Promise<File>;
}

export default function createImageUtilsManagement(
	accountsManagement: AccountsManagement,
	eventStoreManagement: EventStoreManagement,
	loadersManagement: LoadersManagement,
): ImageUtilsManagement {
	const { accounts } = accountsManagement;
	const { eventStore } = eventStoreManagement;

	const imageSizeCache = new Map<string, ImageSize>();

	// Track app settings
	let settings: AppSettings | undefined;
	accounts.active$
		.pipe(
			switchMap((account) =>
				account
					? eventStore.model(
							AppSettingsQuery,
							account.pubkey,
							eventStoreManagement,
							loadersManagement,
						)
					: EMPTY,
			),
		)
		.subscribe((v) => {
			settings = v;
		});

	function getImageSize(src: string): Promise<ImageSize> {
		const cached = imageSizeCache.get(src);
		if (cached) return Promise.resolve(cached);

		return new Promise((res, rej) => {
			const image = new Image();
			image.src = src;

			image.onload = () => {
				const size = { width: image.width, height: image.height };
				imageSizeCache.set(src, size);
				res(size);
			};
			image.onerror = () => rej(new Error("Failed to get image size"));
		});
	}

	function buildImageProxyURL(
		src: string,
		size: string | number,
	): string | undefined {
		let url: URL | null = null;
		if (window.IMAGE_PROXY_PATH) {
			url = new URL(location.origin);
			url.pathname = window.IMAGE_PROXY_PATH;
		} else if (settings?.imageProxy) {
			url = new URL(settings.imageProxy);
		}
		if (url === null) return;

		url.pathname = `${url.pathname.replace(/\/$/, "")}/${size}/${src}`;
		return url.toString();
	}

	async function stripSensitiveMetadataOnFile(file: File): Promise<File> {
		if (file.type === "image/jpeg" || file.type === "image/png") {
			return (await fixOrientationAndStripMetadata(file)) as File;
		}
		return file;
	}

	return {
		getImageSize,
		buildImageProxyURL,
		stripSensitiveMetadataOnFile,
	};
}

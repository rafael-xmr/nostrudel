import { useEffect, useMemo, useState } from "react";
import { Photo, PhotoAlbum, PhotoAlbumProps } from "react-photo-album";
import type { ImageSize } from "../helpers/image";
import { useLocalSettings } from "~/providers/global/preferences";

export type PhotoWithoutSize = Omit<Photo, "width" | "height"> & {
	width?: number;
	height?: number;
};

export default function PhotoGallery<T extends PhotoWithoutSize>({
	photos,
	...props
}: Omit<PhotoAlbumProps<T & ImageSize>, "photos"> & {
	photos: PhotoWithoutSize[];
}) {
	const [loadedSizes, setLoadedSizes] = useState<Record<string, ImageSize>>({});
	const { imageUtilsManagement } = useLocalSettings();

	useEffect(() => {
		for (const photo of photos) {
			imageUtilsManagement.getImageSize(photo.src).then(
				(size) => {
					setLoadedSizes((dir) => ({ ...dir, [photo.src]: size }));
				},
				() => {},
			);
		}
	}, [photos]);

	const loadedPhotos = useMemo(() => {
		const loaded: (T & ImageSize)[] = [];

		for (const photo of photos) {
			if (photo.width && photo.height) {
				loaded.push(photo as T & ImageSize);
				continue;
			}

			const loadedImage = loadedSizes[photo.src];
			if (loadedImage) {
				loaded.push({
					...photo,
					width: loadedImage.width,
					height: loadedImage.height,
				} as T & ImageSize);
			}
		}

		return loaded;
	}, [loadedSizes, photos]);

	return <PhotoAlbum<T & ImageSize> photos={loadedPhotos} {...props} />;
}

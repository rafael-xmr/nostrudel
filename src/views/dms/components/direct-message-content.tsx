import { Box, BoxProps } from "@chakra-ui/react";
import { EmbedableContent, embedUrls } from "../../../helpers/embeds";
import { NostrEvent } from "../../../types/nostr-event";
import {
  embedNostrLinks,
  renderAppleMusicUrl,
  renderGenericUrl,
  renderImageUrl,
  renderRedditUrl,
  renderSimpleXLink,
  renderSongDotLinkUrl,
  renderSoundCloudUrl,
  renderSpotifyUrl,
  renderStemstrUrl,
  renderTidalUrl,
  renderTwitterUrl,
  renderVideoUrl,
  renderWavlakeUrl,
  renderYoutubeUrl,
} from "../../../components/embed-types";
import { TrustProvider } from "../../../providers/local/trust";
import { LightboxProvider } from "../../../components/lightbox-provider";
import { renderAudioUrl } from "../../../components/embed-types/audio";

export default function DirectMessageContent({
  event,
  text,
  children,
  ...props
}: { event: NostrEvent; text: string } & BoxProps) {
  let content: EmbedableContent = [text];

  content = embedNostrLinks(content);
  content = embedUrls(content, [
    renderSimpleXLink,
    renderYoutubeUrl,
    renderTwitterUrl,
    renderRedditUrl,
    renderWavlakeUrl,
    renderAppleMusicUrl,
    renderSpotifyUrl,
    renderTidalUrl,
    renderSongDotLinkUrl,
    renderStemstrUrl,
    renderSoundCloudUrl,
    renderImageUrl,
    renderVideoUrl,
    renderAudioUrl,
    renderGenericUrl,
  ]);

  return (
    <TrustProvider event={event}>
      <LightboxProvider>
        <Box whiteSpace="pre-wrap" {...props}>
          {content}
          {children}
        </Box>
      </LightboxProvider>
    </TrustProvider>
  );
}

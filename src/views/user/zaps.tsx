import { Box, Button, Flex, Select, Text, useDisclosure } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useCallback, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ErrorBoundary, ErrorFallback } from "../../components/error-boundary";
import { LightningIcon } from "../../components/icons";
import { NoteLink } from "../../components/note-link";
import { UserAvatarLink } from "../../components/user-avatar-link";
import { UserLink } from "../../components/user-link";
import { readablizeSats } from "../../helpers/bolt11";
import { truncatedId } from "../../helpers/nostr-event";
import { isProfileZap, isNoteZap, parseZapEvent, totalZaps } from "../../helpers/zaps";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import LoadMoreButton from "../../components/load-more-button";

const Zap = ({ zapEvent }: { zapEvent: NostrEvent }) => {
  const { isOpen, onToggle } = useDisclosure();
  try {
    const { request, payment, eventId } = parseZapEvent(zapEvent);

    return (
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        padding="2"
        display="flex"
        gap="2"
        flexDirection="column"
        flexShrink={0}
      >
        <Flex gap="2" alignItems="center" wrap="wrap">
          <UserAvatarLink pubkey={request.pubkey} size="xs" />
          <UserLink pubkey={request.pubkey} />
          <Text>Zapped</Text>
          {eventId && <NoteLink noteId={eventId} />}
          {payment.amount && (
            <Flex gap="2">
              <LightningIcon color="yellow.400" />
              <Text>{readablizeSats(payment.amount / 1000)} sats</Text>
            </Flex>
          )}
          {request.content && (
            <Button variant="link" onClick={onToggle}>
              Show message
            </Button>
          )}
          <Text ml="auto">{dayjs.unix(request.created_at).fromNow()}</Text>
        </Flex>
        {request.content && isOpen && <Text>{request.content}</Text>}
      </Box>
    );
  } catch (e) {
    if (e instanceof Error) {
      console.log(e);

      return <ErrorFallback error={e} resetErrorBoundary={() => {}} />;
    }
    return null;
  }
};

const UserZapsTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const [filter, setFilter] = useState("both");
  const contextRelays = useAdditionalRelayContext();
  const relays = useReadRelayUrls(contextRelays);

  const eventFilter = useCallback(
    (event: NostrEvent) => {
      switch (filter) {
        case "note":
          return isNoteZap(event);
        case "profile":
          return isProfileZap(event);
      }
      return true;
    },
    [filter]
  );

  const { timeline, loader } = useTimelineLoader(
    `${truncatedId(pubkey)}-zaps`,
    relays,
    { "#p": [pubkey], kinds: [9735] },
    { eventFilter }
  );

  return (
    <Flex direction="column" gap="2" p="2" pb="8" h="full" overflowY="auto">
      <Flex gap="2" alignItems="center" wrap="wrap">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} maxW="md">
          <option value="both">Note & Profile Zaps</option>
          <option value="note">Note Zaps</option>
          <option value="profile">Profile Zaps</option>
        </Select>
        {timeline.length && (
          <Flex gap="2">
            <LightningIcon color="yellow.400" />
            <Text>
              {readablizeSats(totalZaps(timeline) / 1000)} sats in the last{" "}
              {dayjs.unix(timeline[timeline.length - 1].created_at).fromNow(true)}
            </Text>
          </Flex>
        )}
      </Flex>
      {timeline.map((event) => (
        <ErrorBoundary key={event.id}>
          <Zap zapEvent={event} />
        </ErrorBoundary>
      ))}

      <LoadMoreButton timeline={loader} />
    </Flex>
  );
};

export default UserZapsTab;

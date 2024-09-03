import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  IconButton,
  Link,
  Text,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import RequireCurrentAccount from "../../../providers/route/require-current-account";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import useCurrentAccount from "../../../hooks/use-current-account";
import { InboxIcon, OutboxIcon } from "../../../components/icons";
import { RelayUrlInput } from "../../../components/relay-url-input";
import { RelayFavicon } from "../../../components/relay-favicon";
import { RelayMode } from "../../../classes/relay";
import { useCallback } from "react";
import { NostrEvent } from "../../../types/nostr-event";
import { addRelayModeToMailbox, removeRelayModeFromMailbox } from "../../../helpers/nostr/mailbox";
import useAsyncErrorHandler from "../../../hooks/use-async-error-handler";
import { useForm } from "react-hook-form";
import { safeRelayUrl } from "../../../helpers/relay";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { COMMON_CONTACT_RELAY } from "../../../const";
import BackButton from "../../../components/router/back-button";
import AddRelayForm from "../app/add-relay-form";

function RelayLine({ relay, mode, list }: { relay: string; mode: RelayMode; list?: NostrEvent }) {
  const publish = usePublishEvent();
  const remove = useAsyncErrorHandler(async () => {
    const draft = removeRelayModeFromMailbox(list, relay, mode);
    await publish("Remove relay", draft, [COMMON_CONTACT_RELAY]);
  }, [relay, mode, list, publish]);

  return (
    <Flex key={relay} gap="2" alignItems="center" overflow="hidden">
      <RelayFavicon relay={relay} size="xs" />
      <Link as={RouterLink} to={`/r/${encodeURIComponent(relay)}`} isTruncated>
        {relay}
      </Link>
      <IconButton
        aria-label="Remove Relay"
        icon={<CloseIcon />}
        size="xs"
        ml="auto"
        colorScheme="red"
        variant="ghost"
        onClick={remove}
      />
    </Flex>
  );
}

function MailboxesPage() {
  const account = useCurrentAccount()!;
  const publish = usePublishEvent();
  const { inbox, outbox, event } = useUserMailboxes(account.pubkey, { alwaysRequest: true, ignoreCache: true }) || {};

  const addRelay = useCallback(
    async (relay: string, mode: RelayMode) => {
      const draft = addRelayModeToMailbox(event ?? undefined, relay, mode);
      await publish("Add Relay", draft, [COMMON_CONTACT_RELAY]);
    },
    [event],
  );

  return (
    <Flex gap="2" direction="column" overflow="auto hidden" flex={1} px="2">
      <Flex gap="2" alignItems="center">
        <BackButton hideFrom="lg" size="sm" />
        <Heading size="lg">Mailboxes</Heading>
      </Flex>
      <Text fontStyle="italic" mt="-2">
        Mailbox relays are a way for other users to find your events, or send you events. they are defined in{" "}
        <Link
          color="blue.500"
          isExternal
          href={`https://github.com/nostr-protocol/nips/blob/master/65.md`}
          textDecoration="underline"
        >
          NIP-65
        </Link>
      </Text>

      <Flex gap="2" mt="2">
        <InboxIcon boxSize={5} />
        <Heading size="md">Inbox</Heading>
      </Flex>
      <Text fontStyle="italic" mt="-2">
        These relays are used by other users to send DMs and notes to you
      </Text>
      {inbox?.urls
        .sort()
        .map((url) => <RelayLine key={url} relay={url} mode={RelayMode.READ} list={event ?? undefined} />)}
      <AddRelayForm onSubmit={(r) => addRelay(r, RelayMode.READ)} />

      <Flex gap="2" mt="4">
        <OutboxIcon boxSize={5} />
        <Heading size="md">Outbox</Heading>
      </Flex>
      <Text fontStyle="italic" mt="-2">
        moStard will always publish to these relays so other users can find your notes
      </Text>
      {outbox?.urls
        .sort()
        .map((url) => <RelayLine key={url} relay={url} mode={RelayMode.WRITE} list={event ?? undefined} />)}
      <AddRelayForm onSubmit={(r) => addRelay(r, RelayMode.WRITE)} />
    </Flex>
  );
}

export default function MailboxesView() {
  return (
    <RequireCurrentAccount>
      <MailboxesPage />
    </RequireCurrentAccount>
  );
}

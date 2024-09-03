import { Button, Card, CardBody, CardHeader, Flex, Heading, Link, Text } from "@chakra-ui/react";
import BackButton from "../../../components/router/back-button";
import { useAsync } from "react-use";
import { NOSTR_RELAY_TRAY_URL, checkNostrRelayTray, localRelay } from "../../../services/local-relay";
import { CacheRelay } from "nostr-idb";

function InternalRelay() {
  const enabled = localRelay instanceof CacheRelay;
  const enable = () => {
    localStorage.setItem("localRelay", "nostr-idb://internal");
    location.reload();
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Browser Cache</Heading>
        <Button size="sm" colorScheme="primary" ml="auto" onClick={enable} isDisabled={enabled}>
          {enabled ? "Enabled" : "Enable"}
        </Button>
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">Use the browsers built-in database to cache events.</Text>
        <Text>Maximum capacity: 10k events</Text>
        <Text>Performance: Usable, but limited by the browser</Text>
      </CardBody>
    </Card>
  );
}
function NostrRelayTray() {
  const { value: available, loading: checking } = useAsync(checkNostrRelayTray);

  const enabled = localRelay.url.startsWith(NOSTR_RELAY_TRAY_URL);
  const enable = () => {
    localStorage.setItem("localRelay", NOSTR_RELAY_TRAY_URL);
    location.reload();
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Nostr Relay Tray</Heading>
        <Link color="blue.500" href="https://github.com/CodyTseng/nostr-relay-tray" isExternal>
          GitHub
        </Link>
        {available ? (
          <Button size="sm" colorScheme="primary" ml="auto" isLoading={checking} onClick={enable} isDisabled={enabled}>
            {enabled ? "Enabled" : "Enable"}
          </Button>
        ) : (
          <Button
            as={Link}
            isExternal
            href="https://github.com/CodyTseng/nostr-relay-tray"
            colorScheme="blue"
            size="sm"
            ml="auto"
          >
            Get the app
          </Button>
        )}
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">A cool little app that runs a local relay in your systems tray</Text>
        <Text>Maximum capacity: Unlimited</Text>
        <Text>Performance: As fast as your computer</Text>
      </CardBody>
    </Card>
  );
}

function HostedRelay() {
  const enabled = localRelay.url.includes(location.host + "/local-relay");
  const enable = () => {
    localStorage.removeItem("localRelay");
    location.reload();
  };

  return (
    <Card borderColor={enabled ? "primary.500" : undefined} variant="outline">
      <CardHeader p="4" display="flex" gap="2" alignItems="center">
        <Heading size="md">Hosted Relay</Heading>
        <Button size="sm" colorScheme="primary" ml="auto" onClick={enable} isDisabled={enabled}>
          {enabled ? "Enabled" : "Enable"}
        </Button>
      </CardHeader>
      <CardBody p="4" pt="0">
        <Text mb="2">Your installation of moStard is setup with a local relay that can be used as a cache</Text>
        <Text>Maximum capacity: Unknown</Text>
        <Text>Performance: Unknown, but probably fast...</Text>
      </CardBody>
    </Card>
  );
}

export default function CacheRelayView() {
  return (
    <Flex gap="2" direction="column" flex={1}>
      <Flex gap="2" alignItems="center">
        <BackButton hideFrom="lg" size="sm" />
        <Heading size="lg">Cache Relay</Heading>
      </Flex>
      <Text fontStyle="italic" mt="-2" px={{ base: "2", lg: 0 }}>
        The cache relay is used to cache events locally so they can be loaded quickly
      </Text>
      <InternalRelay />
      <NostrRelayTray />
      {window.CACHE_RELAY_ENABLED && <HostedRelay />}
    </Flex>
  );
}

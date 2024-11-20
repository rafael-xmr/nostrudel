import {
	ButtonGroup,
	Flex,
	IconButton,
	Spacer,
	useDisclosure,
} from "@chakra-ui/react";

import type { PayRequest } from ".";
import UserAvatar from "../user/user-avatar";
import UserLink from "../user/user-link";
import { ChevronDownIcon, ChevronUpIcon } from "../icons";
import { InvoiceModalContent } from "../invoice-modal";
import { PropsWithChildren, useEffect, useState } from "react";
import useAppSettings from "../../hooks/use-app-settings";

function UserCard({
	children,
	pubkey,
}: PropsWithChildren & { pubkey: string }) {
	return (
		<Flex gap="2" alignItems="center" overflow="hidden">
			<UserAvatar pubkey={pubkey} size="md" />
			<UserLink pubkey={pubkey} fontWeight="bold" isTruncated />
			<Spacer />
			{children}
		</Flex>
	);
}
function PayRequestCard({
	pubkey,
	address,
	amount,
	onPaid,
}: { pubkey?: string; address?: string; amount: number; onPaid: () => void }) {
	const showMore = useDisclosure({ defaultIsOpen: true });

	return (
		<Flex direction="column" gap="2">
			{pubkey && (
				<UserCard pubkey={pubkey}>
					<ButtonGroup size="sm">
						<IconButton
							icon={showMore.isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
							aria-label="More Options"
							onClick={showMore.onToggle}
						/>
					</ButtonGroup>
				</UserCard>
			)}
			{showMore.isOpen && (
				<InvoiceModalContent
					address={address}
					amount={amount}
					onPaid={onPaid}
				/>
			)}
		</Flex>
	);
}
function ErrorCard({ pubkey, error }: { pubkey: string; error: any }) {
  const showMore = useDisclosure();

  return (
    <Flex direction="column" gap="2">
      <UserCard pubkey={pubkey}>
        <Button size="sm" variant="outline" colorScheme="red" leftIcon={<ErrorIcon />} onClick={showMore.onToggle}>
          Error
        </Button>
      </UserCard>
      {showMore.isOpen && <Alert status="error">{error.message}</Alert>}
    </Flex>
  );
}

export default function PayStep({ callbacks, onComplete }: { callbacks: PayRequest[]; onComplete: () => void }) {
  const [paid, setPaid] = useState<string[]>([]);

  const [payingAll, setPayingAll] = useState(false);

  useEffect(() => {
    const withInvoice = callbacks.filter((p) => !!p.invoice);
    const hasUnpaid = withInvoice.some(({ pubkey }) => !paid.includes(pubkey));
    if (withInvoice.length > 0 && !hasUnpaid) {
      onComplete();
    }
  }, [paid]);

  return (
    <Flex direction="column" gap="4">
      {callbacks.map(({ pubkey, invoice, error }) => {
        if (paid.includes(pubkey))
          return (
            <UserCard key={pubkey} pubkey={pubkey}>
              <Button size="sm" variant="outline" colorScheme="green" leftIcon={<CheckIcon />}>
                Paid
              </Button>
            </UserCard>
          );
        if (error) return <ErrorCard key={pubkey} pubkey={pubkey} error={error} />;
        if (invoice)
          return (
            <PayRequestCard
              key={pubkey}
              pubkey={pubkey}
              invoice={invoice}
              onPaid={() => setPaid((a) => a.concat(pubkey))}
            />
          );
        return null;
      })}
    </Flex>
  );
}

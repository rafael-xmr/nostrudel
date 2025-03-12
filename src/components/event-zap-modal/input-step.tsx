import { useState, useEffect, useRef, useCallback } from "react";
import {
	Flex,
	Input,
	Select,
	Checkbox,
	ModalHeader,
	Text,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import type { NostrEvent } from "../../types/nostr-event";
import { EmbedEvent, type EmbedProps } from "../embed-event";
import useAppSettings from "../../hooks/use-user-app-settings";
import CustomZapAmountOptions from "./zap-options";
import { InvoiceModalContent } from "../invoice-modal";
import { WarningIcon } from "@chakra-ui/icons";

const DEBOUNCE_TIME = 600;

const CURRENCIES = {
	eur: { s: "€" },
	usd: { s: "$" },
	btc: { s: "฿" },
	aed: { s: "" },
	ars: { s: "" },
	aud: { s: "" },
	bdt: { s: "" },
	bhd: { s: "" },
	brl: { s: "" },
	bmd: { s: "" },
	cad: { s: "" },
	chf: { s: "" },
	clp: { s: "" },
	cny: { s: "" },
	czk: { s: "" },
	dkk: { s: "" },
	gbp: { s: "" },
	hkd: { s: "" },
	huf: { s: "" },
	idr: { s: "Rp" },
	ils: { s: "" },
	inr: { s: "" },
	jpy: { s: "" },
	krw: { s: "" },
	kwd: { s: "" },
	lkr: { s: "" },
	mmk: { s: "" },
	mxn: { s: "" },
	myr: { s: "" },
	ngn: { s: "" },
	nok: { s: "" },
	nzd: { s: "" },
	php: { s: "" },
	pkr: { s: "" },
	pln: { s: "" },
	rub: { s: "" },
	sar: { s: "" },
	sek: { s: "" },
	sgd: { s: "" },
	thb: { s: "" },
	try: { s: "" },
	twd: { s: "" },
	uah: { s: "" },
	vef: { s: "" },
	vnd: { s: "" },
	zar: { s: "" },
	xdr: { s: "" },
	xag: { s: "" },
	xau: { s: "" },
	sats: { s: "" },
};

const CACHE_TIME = 5 * 60 * 1000;
const useMoneroPrice = (currency: string, isApiEnabled: boolean) => {
	const [price, setPrice] = useState(null);
	const cacheRef = useRef({});

	useEffect(() => {
		if (!isApiEnabled) return;

		const fetchPrice = async () => {
			const now = Date.now();
			const cache = cacheRef.current;

			if (cache[currency] && now - cache[currency].timestamp < CACHE_TIME) {
				setPrice(cache[currency].price);
			} else {
				try {
					const response = await fetch(
						`https://api.coingecko.com/api/v3/simple/price?ids=monero&vs_currencies=${currency}`,
					);
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					const data = await response.json();
					const newPrice = data.monero[currency];
					setPrice(newPrice);
					cache[currency] = { price: newPrice, timestamp: now };
				} catch (error) {
					console.error("Error fetching price:", error);
				}
			}
		};

		fetchPrice();
	}, [currency, isApiEnabled]);

	return price;
};

export type InputStepProps = {
	pubkey?: string;
	event?: NostrEvent;
	initialComment?: string;
	initialAmount?: number;
	defaultAmount?: number;
	allowComment?: boolean;
	showEmbed?: boolean;
	embedProps?: EmbedProps;
	address?: string;
};

export default function InputStep({
	event,
	initialComment,
	initialAmount,
	defaultAmount,
	showEmbed = true,
	embedProps,
	address,
}: InputStepProps) {
	const { customZapAmounts } = useAppSettings();
	const [isApiEnabled, setIsApiEnabled] = useState(false);

	const {
		register,
		watch,
		setValue,
		formState: { errors },
	} = useForm<{
		comment: string;
		xmrAmount: number;
		fiatAmount: number;
		currency: string;
	}>({
		mode: "onBlur",
		defaultValues: {
			xmrAmount:
				defaultAmount ??
				initialAmount ??
				(Number.parseFloat(customZapAmounts.split(",")[0]) || 0),
			fiatAmount: 0,
			currency: "usd",
			comment: initialComment ?? "",
		},
	});

	const selectedCurrency = watch("currency");
	const price = useMoneroPrice(selectedCurrency, isApiEnabled);

	const useDebouncedCallback = (
		callback: (arg: number) => void,
		delay: number,
	) => {
		const timeoutRef = useRef();
		return useCallback(
			(arg: number) => {
				if (timeoutRef.current) clearTimeout(timeoutRef.current);
				// @ts-ignore
				timeoutRef.current = setTimeout(() => callback(arg), delay);
			},
			[callback, delay],
		);
	};

	const updateFiat = useCallback(
		(xmr: number) => {
			if (isApiEnabled && price && !Number.isNaN(xmr)) {
				const fiatAmount = (xmr * price).toFixed(2);
				setValue("fiatAmount", Number(fiatAmount));
			}
		},
		[isApiEnabled, price, setValue],
	);
	const debouncedUpdateFiat = useDebouncedCallback(updateFiat, DEBOUNCE_TIME);

	const updateXmr = useCallback(
		(fiat: number) => {
			if (price && !Number.isNaN(fiat)) {
				const xmrAmount = (fiat / price).toFixed(4);
				setValue("xmrAmount", Number(xmrAmount));
			}
		},
		[price, setValue],
	);
	const debouncedUpdateXmr = useDebouncedCallback(updateXmr, DEBOUNCE_TIME);

	useEffect(() => {
		if (!isApiEnabled) return;

		const xmrAmount = watch("xmrAmount");
		if (price && xmrAmount) {
			const fiatAmount = Number((xmrAmount * price).toFixed(2));
			setValue("fiatAmount", fiatAmount);
		}
	}, [price, watch, setValue, isApiEnabled]);

	const xmrRegister = register("xmrAmount", {
		valueAsNumber: true,
	});
	const fiatRegister = register("fiatAmount", {
		valueAsNumber: true,
	});

	if (!address) {
		return (
			<Flex gap="4" direction="column">
				{showEmbed && event && <EmbedEvent event={event} {...embedProps} />}

				<ModalHeader px="0" pb="0" pt="4">
					Tried to send a tip, but couldn't find a Monero address in your
					friend's profile!
				</ModalHeader>
				<Text>
					You might want to ask your friend to add one. Or send a message to
					request the address.
				</Text>
          {/* TODO: send message from here */}

				<WarningIcon boxSize={"max"} px="40" py="20" />
			</Flex>
		);
	}

	return (
		<Flex gap="4" direction="column">
			{showEmbed && event && <EmbedEvent event={event} {...embedProps} />}

			<InvoiceModalContent
				address={address}
				amount={watch("xmrAmount")}
				onPaid={() => {}}
			/>

			{defaultAmount ? null : (
				<>
					<CustomZapAmountOptions
						onSelect={(amount) =>
							setValue("xmrAmount", amount, { shouldDirty: true })
						}
					/>

					<Flex gap="2" alignItems="center">
						XMR
						<Input
							type="number"
							placeholder="Custom amount XMR"
							step={0.0001}
							isInvalid={!!errors.xmrAmount}
							{...xmrRegister}
							onChange={(e) => {
								xmrRegister.onChange(e);
								const xmr = Number(e.target.value);
								debouncedUpdateFiat(xmr);
							}}
						/>
					</Flex>

					<Flex gap="2" alignItems="center">
						<Checkbox
							isChecked={isApiEnabled}
							onChange={(e) => setIsApiEnabled(e.target.checked)}
						>
							Enable CoinGecko API for fiat currency rates
						</Checkbox>
					</Flex>

					{isApiEnabled && (
						<Flex gap="2" alignItems="center">
							<Select flex={1} w="sm" {...register("currency")}>
								{Object.keys(CURRENCIES).map((code) => (
									<option key={code} value={code}>
										{code.toUpperCase()}
									</option>
								))}
							</Select>

							<Input
								flex={3}
								type="number"
								placeholder={`Custom amount ${selectedCurrency.toUpperCase()}`}
								step={0.01}
								isInvalid={!!errors.fiatAmount}
								{...fiatRegister}
								onChange={(e) => {
									fiatRegister.onChange(e);
									const fiat = Number(e.target.value);
									debouncedUpdateXmr(fiat);
								}}
							/>
						</Flex>
					)}
				</>
			)}
		</Flex>
	);
}

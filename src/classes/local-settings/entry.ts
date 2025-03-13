import { BehaviorSubject } from "rxjs";
import { localStorageWrapper } from "~/utils/localStorage";

export class NullableLocalStorageEntry<
	T = string,
> extends BehaviorSubject<T | null> {
	key: string;
	decode?: (raw: string | null) => T | null;
	encode?: (value: T) => string | null;

	constructor(
		key: string,
		initValue: T | null = null,
		decode?: (raw: string | null) => T | null,
		encode?: (value: T) => string | null,
	) {
		let value = initValue;
		if (localStorageWrapper.hasOwn(key)) {
			const raw = localStorageWrapper.getItem(key);

			if (decode) value = decode(raw);
			else value = raw as T | null;
		}

		super(value);
		this.key = key;
		this.decode = decode;
		this.encode = encode;
	}

	next(value: T | null) {
		if (value === null) {
			localStorageWrapper.removeItem(this.key);

			super.next(value);
		} else {
			const encoded = this.encode ? this.encode(value) : String(value);
			if (encoded !== null) localStorageWrapper.setItem(this.key, encoded);
			else localStorageWrapper.removeItem(this.key);

			super.next(value);
		}
	}

	clear() {
		this.next(null);
	}
}

export class LocalStorageEntry<T = string> extends BehaviorSubject<T> {
	key: string;
	fallback: T;
	decode?: (raw: string) => T;
	encode?: (value: T) => string | null;

	setDefault = false;

	constructor(
		key: string,
		fallback: T,
		decode?: (raw: string) => T,
		encode?: (value: T) => string | null,
		setDefault = false,
	) {
		let value = fallback;
		if (localStorageWrapper.hasOwn(key)) {
			const raw = localStorageWrapper.getItem(key);

			if (decode && raw) value = decode(raw);
			else if (raw) value = raw as T;
		} else if (setDefault) {
			const encoded = encode ? encode(fallback) : String(fallback);
			if (!encoded)
				throw new Error("encode can not return null when setDefault is set");
			localStorageWrapper.setItem(key, encoded);
		}

		super(value);

		this.key = key;
		this.decode = decode;
		this.encode = encode;
		this.fallback = fallback;
		this.setDefault = setDefault;
	}

	next(value: T) {
		const encoded = this.encode ? this.encode(value) : String(value);
		if (encoded !== null) localStorageWrapper.setItem(this.key, encoded);
		else if (this.setDefault && encoded)
			localStorageWrapper.setItem(this.key, encoded);
		else localStorageWrapper.removeItem(this.key);

		super.next(value);
	}

	clear() {
		localStorageWrapper.removeItem(this.key);
		super.next(this.fallback);
	}
}

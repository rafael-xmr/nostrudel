import { cbc } from "@noble/ciphers/aes";
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToUtf8, utf8ToBytes } from "@noble/hashes/utils";

export interface SecureStorage {
	readonly unlocked: boolean;
	readonly database: LocalForageDbMethods;
	setItem(
		key: string,
		value: string,
		encryptionKey?: Uint8Array,
	): Promise<boolean>;
	getItem(key: string, encryptionKey?: Uint8Array): Promise<string | null>;
	removeItem(key: string): Promise<void>;
	clear(): Promise<void>;
	unlock(password: string, testKey?: string): Promise<boolean>;
	lock(): void;
}

// Factory function to create SecureStorage
export default function createSecureStorage(
	database: LocalForageDbMethods,
	salt: Uint8Array,
): SecureStorage {
	let key: Uint8Array | null = null;

	return {
		get unlocked() {
			return key !== null;
		},
		database,

		// Generate encryption key from password
		async unlock(password: string, testKey = "_pass_test_"): Promise<boolean> {
			try {
				// Convert password to bytes
				const passBytes = utf8ToBytes(password);

				// Use PBKDF2 to derive a key from the password
				const derivedKey = pbkdf2(sha256, passBytes, salt, {
					c: 10000,
					dkLen: 32,
				});

				// Try to get a known test value with this password
				const testValue = await this.getItem(testKey, derivedKey);

				// If we've never set a test value with this password before, set one
				if (testValue === null) {
					// First setup
					await this.setItem(testKey, "password verification data", derivedKey);
					key = derivedKey;
					return true;
				}
				if (testValue === "password verification data") {
					// Save the key for later
					key = derivedKey;
					return true;
				}
			} catch (error) {
				// decryption failed, do nothing
			}

			return false;
		},

		lock() {
			key = null;
		},

		// Encrypt and store data
		async setItem(
			itemKey: string,
			value: string,
			encryptionKey = key,
		): Promise<boolean> {
			if (!encryptionKey) throw new Error("Storage locked");

			try {
				// Convert value to bytes
				const valueBytes = utf8ToBytes(value);

				// Generate a random IV for CBC mode
				const iv = crypto.getRandomValues(new Uint8Array(16));

				// Create AES-CBC cipher
				const cipher = cbc(encryptionKey, iv);

				// Encrypt the data
				const encryptedData = cipher.encrypt(valueBytes);

				// Store IV and encrypted data
				const dataToStore = { iv, data: encryptedData };

				await database.setItem(itemKey, dataToStore);
				return true;
			} catch (error) {
				console.error("Encryption error:", error);
				return false;
			}
		},

		// Retrieve and decrypt data
		async getItem(
			itemKey: string,
			encryptionKey = key,
		): Promise<string | null> {
			if (!encryptionKey) throw new Error("Storage locked");

			// Get encrypted data
			const encryptedPackage = (await database.getItem(itemKey)) as {
				iv: Uint8Array;
				data: Uint8Array;
			} | null;
			if (!encryptedPackage) return null;

			try {
				// Create AES-CBC decipher
				const decipher = cbc(encryptionKey, encryptedPackage.iv);

				// Decrypt the data
				const decryptedBytes = decipher.decrypt(encryptedPackage.data);

				// Convert bytes to UTF-8 string
				return bytesToUtf8(decryptedBytes);
			} catch (e) {
				throw new Error("Decryption failed, incorrect password");
			}
		},

		// Remove an item
		async removeItem(itemKey: string): Promise<void> {
			return database.removeItem(itemKey);
		},

		// Clear all stored data
		async clear(): Promise<void> {
			return database.clear();
		},
	};
}

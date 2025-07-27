import db from ".";

async function getItem<T>(key: string) {
	return (await db).get("kv", key) as Promise<T | undefined>;
}

async function setItem<T>(key: string, value: T) {
	return (await db).put("kv", value, key);
}

async function deleteItem(key: string) {
	return (await db).delete("kv", key);
}

const idbKeyValueStore = {
	getItem,
	setItem,
	deleteItem,
};

export default idbKeyValueStore;

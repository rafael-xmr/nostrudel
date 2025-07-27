export const localStorageWrapper = {
	hasOwn: (key) => {
		if (typeof window !== "undefined") {
			return Object.prototype.hasOwnProperty.call(localStorage, key);
		}
	},
	getItem: (key) => {
		if (typeof window !== "undefined") {
			return localStorage.getItem(key);
		}
		return null; // Return a fallback value for SSR
	},
	setItem: (key, value) => {
		if (typeof window !== "undefined") {
			localStorage.setItem(key, value);
		}
	},
	removeItem: (key) => {
		if (typeof window !== "undefined") {
			localStorage.removeItem(key);
		}
	},
	clear: () => {
		if (typeof window !== "undefined") {
			localStorage.clear();
		}
	},
};

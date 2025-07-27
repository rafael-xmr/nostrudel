import { type OperatorFunction, scan } from "rxjs";

export function scanToArray<T>(): OperatorFunction<T, T[]> {
	return (source) =>
		source.pipe(scan((arr, value) => [...arr, value], [] as T[]));
}

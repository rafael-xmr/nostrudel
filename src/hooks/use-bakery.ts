import { useObservable } from "applesauce-react/hooks";
import { useBakeryProvider } from "~/providers/global/bakery-provider";

export default function useBakery() {
	const { bakery$ } = useBakeryProvider();
	return useObservable(bakery$);
}

import { useObservable } from "applesauce-react/hooks";
import { useBakeryProvider } from "~/providers/global/bakery-provider";

export default function useBakeryControl() {
	const { controlApi$ } = useBakeryProvider();
	return useObservable(controlApi$);
}

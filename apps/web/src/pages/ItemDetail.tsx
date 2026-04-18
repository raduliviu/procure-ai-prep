import { useParams } from "@tanstack/react-router";

export function ItemDetail() {
	// from-path form avoids a circular import with the route module;
	// the path string is still type-checked against the registered route
	// tree thanks to the module augmentation in router.tsx.
	const { id } = useParams({ from: "/items/$id" });
	return <div>Item detail: {id}</div>;
}

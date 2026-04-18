import { useParams } from "@tanstack/react-router";

export function RequestDetail() {
	// from-path form avoids a circular import with the route module;
	// path string is still type-checked against the registered route tree
	// thanks to the module augmentation in router.tsx
	const { id } = useParams({ from: "/requests/$id" });
	return <div>Request detail: {id}</div>;
}

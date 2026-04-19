import { Outlet } from "@tanstack/react-router";
import { Header } from "../components/Header";

export function RootLayout() {
	return (
		<div className="bg-muted/30 min-h-screen">
			<Header />
			<main>
				<Outlet />
			</main>
		</div>
	);
}

import { Link } from "@tanstack/react-router";

export function Header() {
	return (
		<header>
			<nav>
				<Link to="/">
					<strong>App</strong>
				</Link>
				{" | "}
				<Link to="/items/new">New item</Link>
			</nav>
		</header>
	);
}

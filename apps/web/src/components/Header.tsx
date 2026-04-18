import { Link } from "@tanstack/react-router";
import { useUserId } from "../lib/useUserId";
import { APPROVER_ID, REQUESTER_ID } from "../lib/users";

export function Header() {
	const [userId, setUserId] = useUserId();

	const isRequester = userId === REQUESTER_ID;
	const isApprover = userId === APPROVER_ID;

	return (
		<header>
			<nav>
				<Link to="/">
					<strong>Procure AI Prep</strong>
				</Link>
				{" | "}
				<Link to="/requests/new">New request</Link>
			</nav>
			<div>
				<span>Role:</span>{" "}
				<button
					type="button"
					onClick={() => {
						setUserId(REQUESTER_ID);
					}}
					disabled={isRequester}
				>
					Requester
				</button>{" "}
				<button
					type="button"
					onClick={() => {
						setUserId(APPROVER_ID);
					}}
					disabled={isApprover}
				>
					Approver
				</button>
			</div>
		</header>
	);
}

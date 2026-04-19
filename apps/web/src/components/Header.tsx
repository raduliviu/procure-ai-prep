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
				<Link
					to="/"
					activeProps={{ className: "font-bold" }}
					activeOptions={{ exact: true }}
				>
					Procure AI Prep
				</Link>
				{" | "}
				<Link to="/requests/new" activeProps={{ className: "font-bold" }}>
					New request
				</Link>
			</nav>
			<div>
				<span>Role:</span>{" "}
				<button
					type="button"
					onClick={() => {
						setUserId(REQUESTER_ID);
					}}
					disabled={isRequester}
					className={isRequester ? "font-bold" : undefined}
				>
					Requester
				</button>{" "}
				<button
					type="button"
					onClick={() => {
						setUserId(APPROVER_ID);
					}}
					disabled={isApprover}
					className={isApprover ? "font-bold" : undefined}
				>
					Approver
				</button>
			</div>
		</header>
	);
}

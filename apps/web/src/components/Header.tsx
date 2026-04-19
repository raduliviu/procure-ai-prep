import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useUserId } from "../lib/useUserId";
import { APPROVER_ID, REQUESTER_ID } from "../lib/users";

export function Header() {
	const [userId, setUserId] = useUserId();
	const location = useLocation();

	const isHome = location.pathname === "/";
	const isNew = location.pathname === "/requests/new";
	const isRequester = userId === REQUESTER_ID;
	const isApprover = userId === APPROVER_ID;

	const navBase = "rounded px-3 py-1.5 text-sm transition-colors";
	const navActive = "bg-muted text-foreground";
	const navIdle = "text-muted-foreground hover:text-foreground";

	return (
		<header className="bg-background sticky top-0 z-10 border-b">
			<div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
				<div className="flex items-center gap-6">
					<Link to="/" className="flex items-center gap-2">
						<span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded font-mono text-xs font-bold">
							PA
						</span>
						<span className="font-semibold">Procure AI</span>
					</Link>
					<nav className="flex items-center gap-1">
						<Link to="/" className={cn(navBase, isHome ? navActive : navIdle)}>
							Queue
						</Link>
						{!isApprover && (
							<Link
								to="/requests/new"
								className={cn(navBase, isNew ? navActive : navIdle)}
							>
								New request
							</Link>
						)}
					</nav>
				</div>
				<div className="flex items-center gap-3">
					<span className="text-muted-foreground text-xs">Role</span>
					<div className="bg-muted inline-flex rounded-md p-0.5">
						<RoleButton active={isRequester} onClick={() => setUserId(REQUESTER_ID)}>
							Requester
						</RoleButton>
						<RoleButton active={isApprover} onClick={() => setUserId(APPROVER_ID)}>
							Approver
						</RoleButton>
					</div>
				</div>
			</div>
		</header>
	);
}

function RoleButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={active}
			className={cn(
				"rounded px-3 py-1 text-xs font-medium transition-colors",
				active
					? "bg-background text-foreground shadow-sm"
					: "text-muted-foreground hover:text-foreground cursor-pointer",
			)}
		>
			{children}
		</button>
	);
}

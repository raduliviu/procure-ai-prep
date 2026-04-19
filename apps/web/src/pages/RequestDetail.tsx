import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
	PurchaseRequestSchema,
	type DecisionBody,
	type PurchaseRequest,
	type RequestStatus,
} from "@procure/shared";
import { ArrowLeft, Check, CheckCircle2, Clock, RefreshCw, Sparkles, XCircle } from "lucide-react";
import { api, ApiError } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/useUserId";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STATUS_VARIANT: Record<RequestStatus, "default" | "secondary" | "destructive" | "outline"> = {
	submitted: "secondary",
	triaged: "default",
	approved: "outline",
	rejected: "destructive",
};

const STATUS_LABEL: Record<RequestStatus, string> = {
	submitted: "Submitted",
	triaged: "Triaged",
	approved: "Approved",
	rejected: "Rejected",
};

const STATUS_ICON: Record<RequestStatus, React.ComponentType<{ className?: string }>> = {
	submitted: Clock,
	triaged: Sparkles,
	approved: CheckCircle2,
	rejected: XCircle,
};

function hasTriageData(r: PurchaseRequest): boolean {
	return (
		r.triageCategory !== null ||
		r.triageEstimatedAmount !== null ||
		r.triageCurrency !== null ||
		r.triageUrgency !== null ||
		r.triageSuggestedVendors !== null ||
		r.triageReasoning !== null
	);
}

function formatMoney(amount: string | null, currency: string | null): string {
	if (amount === null) return "—";
	return `${amount}${currency ? ` ${currency}` : ""}`;
}

function timeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	const months = Math.floor(days / 30);
	return `${months}mo ago`;
}

function formatDateTime(iso: string): string {
	return new Date(iso).toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

export function RequestDetail() {
	const { id } = useParams({ from: "/requests/$id" });
	const role = useRole();
	const queryClient = useQueryClient();
	const [note, setNote] = useState("");

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["requests", id],
		queryFn: () =>
			api.get<PurchaseRequest>(`/api/requests/${id}`, {
				parse: (raw) => PurchaseRequestSchema.parse(raw),
			}),
	});

	const decide = useMutation({
		mutationFn: (body: DecisionBody) =>
			api.post<PurchaseRequest>(`/api/requests/${id}/decision`, body, {
				parse: (raw) => PurchaseRequestSchema.parse(raw),
			}),
		onSuccess: async (updated) => {
			queryClient.setQueryData(["requests", id], updated);
			await queryClient.invalidateQueries({ queryKey: ["requests"], exact: false });
			setNote("");
		},
	});

	const retriage = useMutation({
		mutationFn: () =>
			api.post<PurchaseRequest>(
				`/api/requests/${id}/triage`,
				{},
				{
					parse: (raw) => PurchaseRequestSchema.parse(raw),
				},
			),
		onSuccess: async (updated) => {
			queryClient.setQueryData(["requests", id], updated);
			await queryClient.invalidateQueries({ queryKey: ["requests"], exact: false });
		},
	});

	if (isLoading) {
		return (
			<div className="mx-auto max-w-3xl px-4 py-8">
				<p className="text-muted-foreground">Loading request…</p>
			</div>
		);
	}

	if (isError) {
		const status = error instanceof ApiError ? error.status : null;
		return (
			<div className="mx-auto max-w-3xl px-4 py-8">
				<p className="text-destructive">
					{status === 404
						? "Request not found."
						: status === 401
							? "Pick a role from the header to view requests."
							: error instanceof Error
								? error.message
								: "Failed to load request."}
				</p>
				<Link to="/" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
					Back to queue
				</Link>
			</div>
		);
	}

	if (!data) return null;

	const showDecisionBar = role === "approver" && data.status === "triaged";
	const alreadyDecided = data.status === "approved" || data.status === "rejected";
	const triageRun = hasTriageData(data);
	// The API blocks re-triage once a decision has been made. The UI
	// hides the button in those cases so the affordance matches the
	// backend rule.
	const canRetriage = role !== null && (data.status === "submitted" || data.status === "triaged");

	return (
		<div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
			<Link
				to="/"
				className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
			>
				<ArrowLeft className="size-4" />
				Back to queue
			</Link>

			<div>
				<div className="flex flex-wrap items-center gap-3">
					<h1 className="text-2xl font-semibold tracking-tight">Purchase request</h1>
					<StatusBadge status={data.status} />
				</div>
				<p className="text-muted-foreground mt-1 text-sm">
					<span className="font-mono text-xs">{data.id.slice(0, 8)}</span>
					<span className="mx-2">·</span>
					Submitted {timeAgo(data.createdAt)}
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Request text</CardTitle>
					<CardDescription>Submitted by the requester in plain English.</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="whitespace-pre-wrap">{data.rawText}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-start justify-between gap-4">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Sparkles className="text-muted-foreground size-4" />
								AI triage
							</CardTitle>
							<CardDescription>
								{triageRun
									? "Extracted fields from the latest triage run."
									: "Triage has not run yet — either the initial attempt failed or the request was just created. Try re-running it."}
							</CardDescription>
						</div>
						{canRetriage && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => {
									retriage.mutate();
								}}
								disabled={retriage.isPending}
							>
								<RefreshCw
									className={cn("size-3.5", retriage.isPending && "animate-spin")}
								/>
								{retriage.isPending
									? "Re-running…"
									: triageRun
										? "Re-run"
										: "Run triage"}
							</Button>
						)}
					</div>
					{retriage.isError && (
						<p className="text-destructive mt-2 text-sm">
							{retriage.error instanceof ApiError
								? ((retriage.error.body as { error?: string })?.error ??
									`${retriage.error.status}: triage failed`)
								: retriage.error instanceof Error
									? retriage.error.message
									: "Triage failed."}
						</p>
					)}
				</CardHeader>
				<CardContent>
					{triageRun ? (
						<dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<TriageField label="Category" value={data.triageCategory} />
							<TriageField
								label="Estimated amount"
								value={formatMoney(data.triageEstimatedAmount, data.triageCurrency)}
							/>
							<TriageField label="Urgency" value={data.triageUrgency} />
							<ConfidenceField value={data.triageConfidence} />
							{data.triageReasoning && (
								<div className="sm:col-span-2">
									<dt className="text-muted-foreground text-xs font-medium">
										Reasoning
									</dt>
									<dd className="mt-1 text-sm">{data.triageReasoning}</dd>
								</div>
							)}
							{data.triageSuggestedVendors &&
								data.triageSuggestedVendors.length > 0 && (
									<div className="sm:col-span-2">
										<dt className="text-muted-foreground mb-2 text-xs font-medium">
											Suggested vendors
										</dt>
										<ul className="space-y-2">
											{data.triageSuggestedVendors.map((v) => (
												<li
													key={v.name}
													className="bg-muted/40 rounded-md px-3 py-2 text-sm"
												>
													<span className="font-medium">{v.name}</span>{" "}
													<span className="text-muted-foreground">
														— {v.reason}
													</span>
												</li>
											))}
										</ul>
									</div>
								)}
						</dl>
					) : (
						<p className="text-muted-foreground text-sm">
							Once the triage endpoint is implemented, the category, estimated spend,
							urgency, suggested vendors, confidence, and reasoning will appear here.
						</p>
					)}
				</CardContent>
			</Card>

			{alreadyDecided && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							{data.status === "approved" ? (
								<CheckCircle2 className="text-muted-foreground size-4" />
							) : (
								<XCircle className="text-muted-foreground size-4" />
							)}
							Decision
						</CardTitle>
						<CardDescription>
							{data.status === "approved" ? "Approved" : "Rejected"}
							{data.decidedAt ? ` on ${formatDateTime(data.decidedAt)}` : ""}.
						</CardDescription>
					</CardHeader>
					{data.decisionNote && (
						<CardContent>
							<p className="whitespace-pre-wrap text-sm">{data.decisionNote}</p>
						</CardContent>
					)}
				</Card>
			)}

			{showDecisionBar && (
				<Card>
					<CardHeader>
						<CardTitle>Decision</CardTitle>
						<CardDescription>
							Approve or reject this request. The note is optional and shown on the
							request later.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-2">
							<Label htmlFor="decisionNote">Note (optional)</Label>
							<Textarea
								id="decisionNote"
								placeholder="Optional context for the decision…"
								rows={3}
								maxLength={2000}
								value={note}
								onChange={(e) => {
									setNote(e.target.value);
								}}
								disabled={decide.isPending}
							/>
						</div>
						<div className="flex gap-2">
							<Button
								type="button"
								onClick={() => {
									decide.mutate({
										decision: "approved",
										note: note.trim() ? note.trim() : undefined,
									});
								}}
								disabled={decide.isPending}
							>
								<Check className="size-3.5" />
								{decide.isPending && decide.variables?.decision === "approved"
									? "Approving…"
									: "Approve"}
							</Button>
							<Button
								type="button"
								variant="destructive"
								onClick={() => {
									decide.mutate({
										decision: "rejected",
										note: note.trim() ? note.trim() : undefined,
									});
								}}
								disabled={decide.isPending}
							>
								<XCircle className="size-3.5" />
								{decide.isPending && decide.variables?.decision === "rejected"
									? "Rejecting…"
									: "Reject"}
							</Button>
						</div>
						{decide.isError && (
							<p className="text-destructive text-sm">
								{decide.error instanceof ApiError
									? ((decide.error.body as { error?: string })?.error ??
										`${decide.error.status}: decision failed`)
									: decide.error instanceof Error
										? decide.error.message
										: "Decision failed."}
							</p>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function StatusBadge({ status }: { status: RequestStatus }) {
	const Icon = STATUS_ICON[status];
	return (
		<Badge variant={STATUS_VARIANT[status]} className="gap-1">
			<Icon className="size-3" />
			{STATUS_LABEL[status]}
		</Badge>
	);
}

function TriageField({ label, value }: { label: string; value: string | null }) {
	return (
		<div>
			<dt className="text-muted-foreground text-xs font-medium">{label}</dt>
			<dd className="mt-1 text-sm">{value ?? "—"}</dd>
		</div>
	);
}

function ConfidenceField({ value }: { value: number | null }) {
	return (
		<div>
			<dt className="text-muted-foreground text-xs font-medium">Confidence</dt>
			<dd className="mt-1 flex items-center gap-2">
				{value !== null ? (
					<>
						<div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
							<div
								className="bg-primary h-full rounded-full transition-all"
								style={{ width: `${value * 100}%` }}
							/>
						</div>
						<span className="w-10 text-right text-xs tabular-nums">
							{Math.round(value * 100)}%
						</span>
					</>
				) : (
					<span className="text-sm">—</span>
				)}
			</dd>
		</div>
	);
}

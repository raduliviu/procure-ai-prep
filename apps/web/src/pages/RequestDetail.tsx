import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import {
    PurchaseRequestSchema,
    type PurchaseRequest,
    type RequestStatus,
} from '@procure/shared';
import { api, ApiError } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { useRole } from '@/lib/useUserId';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const STATUS_VARIANT: Record<RequestStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    submitted: 'secondary',
    triaged: 'default',
    approved: 'outline',
    rejected: 'destructive',
};

const STATUS_LABEL: Record<RequestStatus, string> = {
    submitted: 'Submitted',
    triaged: 'Triaged',
    approved: 'Approved',
    rejected: 'Rejected',
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
    if (amount === null) return '—';
    return `${amount}${currency ? ` ${currency}` : ''}`;
}

export function RequestDetail() {
    const { id } = useParams({ from: '/requests/$id' });
    const role = useRole();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['requests', id],
        queryFn: () =>
            api.get<PurchaseRequest>(`/api/requests/${id}`, {
                parse: (raw) => PurchaseRequestSchema.parse(raw),
            }),
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
                        ? 'Request not found.'
                        : status === 401
                          ? 'Pick a role from the header to view requests.'
                          : error instanceof Error
                            ? error.message
                            : 'Failed to load request.'}
                </p>
                <Link
                    to="/"
                    className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}
                >
                    Back to queue
                </Link>
            </div>
        );
    }

    if (!data) return null;

    const showDecisionBar = role === 'approver' && data.status === 'triaged';
    const triageRun = hasTriageData(data);

    return (
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground font-mono text-xs">
                        {data.id.slice(0, 8)}
                    </p>
                    <h1 className="text-2xl font-semibold">Purchase request</h1>
                </div>
                <Badge variant={STATUS_VARIANT[data.status]} className="text-sm">
                    {STATUS_LABEL[data.status]}
                </Badge>
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
                    <CardTitle>AI triage</CardTitle>
                    <CardDescription>
                        {triageRun
                            ? 'Extracted fields from the latest triage run.'
                            : 'Triage has not run yet. It will populate these fields once the AI integration lands.'}
                    </CardDescription>
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
                            <TriageField
                                label="Confidence"
                                value={
                                    data.triageConfidence !== null
                                        ? `${Math.round(data.triageConfidence * 100)}%`
                                        : null
                                }
                            />
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
                                                    <span className="font-medium">{v.name}</span>{' '}
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
                            Once the triage endpoint is implemented, the category, estimated
                            spend, urgency, suggested vendors, confidence, and reasoning will
                            appear here.
                        </p>
                    )}
                </CardContent>
            </Card>

            {showDecisionBar && (
                <Card>
                    <CardHeader>
                        <CardTitle>Decision</CardTitle>
                        <CardDescription>
                            Approve or reject this request. A decision endpoint will land in the
                            next step — the buttons are rendered now as a placeholder.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="decisionNote">Note (optional)</Label>
                            <Textarea
                                id="decisionNote"
                                placeholder="Optional context for the decision…"
                                rows={3}
                                disabled
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button disabled>Approve</Button>
                            <Button variant="destructive" disabled>
                                Reject
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div>
                <Link to="/" className={buttonVariants({ variant: 'outline' })}>
                    Back to queue
                </Link>
            </div>
        </div>
    );
}

function TriageField({ label, value }: { label: string; value: string | null }) {
    return (
        <div>
            <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
            <dd className="mt-1 text-sm">{value ?? '—'}</dd>
        </div>
    );
}

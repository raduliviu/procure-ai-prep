import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
    PurchaseRequestListSchema,
    RequestStatusSchema,
    type PurchaseRequest,
    type RequestStatus,
} from '@procure/shared';
import { api, ApiError } from '@/lib/apiClient';
import { useRole } from '@/lib/useUserId';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type StatusFilter = RequestStatus | 'all';

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

function truncate(text: string, max = 140): string {
    if (text.length <= max) return text;
    return text.slice(0, max).trimEnd() + '…';
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export function Queue() {
    const role = useRole();
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const queryKey =
        statusFilter === 'all' ? (['requests'] as const) : (['requests', { status: statusFilter }] as const);

    const { data, isLoading, isError, error } = useQuery({
        queryKey,
        queryFn: () => {
            const path =
                statusFilter === 'all' ? '/api/requests' : `/api/requests?status=${statusFilter}`;
            return api.get<PurchaseRequest[]>(path, {
                parse: (raw) => PurchaseRequestListSchema.parse(raw),
            });
        },
    });

    return (
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Queue</h1>
                    <p className="text-muted-foreground text-sm">
                        {role === 'approver'
                            ? 'All requests in the system.'
                            : role === 'requester'
                              ? 'Your submitted requests.'
                              : 'Pick a role from the header to see requests.'}
                    </p>
                </div>
                <div className="flex items-end gap-2">
                    <div className="grid gap-1.5">
                        <Label htmlFor="status-filter" className="text-xs">
                            Status
                        </Label>
                        <Select
                            value={statusFilter}
                            onValueChange={(v) => {
                                setStatusFilter(v as StatusFilter);
                            }}
                        >
                            <SelectTrigger id="status-filter" className="w-36">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {RequestStatusSchema.options.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {STATUS_LABEL[s]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Link to="/requests/new" className={buttonVariants()}>
                        New request
                    </Link>
                </div>
            </div>

            {isLoading && <p className="text-muted-foreground">Loading requests…</p>}

            {isError && (
                <p className="text-destructive">
                    {error instanceof ApiError && error.status === 401
                        ? 'Pick a role from the header to view requests.'
                        : error instanceof Error
                          ? error.message
                          : 'Failed to load requests.'}
                </p>
            )}

            {data && data.length === 0 && (
                <Card>
                    <CardContent className="py-10 text-center">
                        <p className="text-muted-foreground">
                            {statusFilter === 'all'
                                ? 'No requests yet.'
                                : `No ${STATUS_LABEL[statusFilter].toLowerCase()} requests.`}
                        </p>
                        <Link
                            to="/requests/new"
                            className={buttonVariants({ variant: 'outline' }) + ' mt-4'}
                        >
                            Submit your first request
                        </Link>
                    </CardContent>
                </Card>
            )}

            {data && data.length > 0 && (
                <ul className="space-y-3">
                    {data.map((r) => (
                        <li key={r.id}>
                            <Link
                                to="/requests/$id"
                                params={{ id: r.id }}
                                className="block focus-visible:outline-none"
                            >
                                <Card className="hover:border-foreground/20 transition-colors">
                                    <CardContent className="flex gap-4 py-4">
                                        <div className="flex-shrink-0">
                                            <Badge variant={STATUS_VARIANT[r.status]}>
                                                {STATUS_LABEL[r.status]}
                                            </Badge>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-muted-foreground font-mono text-xs">
                                                {r.id.slice(0, 8)}
                                            </p>
                                            <p className="mt-1 truncate text-sm">
                                                {truncate(r.rawText)}
                                            </p>
                                        </div>
                                        <div className="text-muted-foreground flex-shrink-0 text-xs">
                                            {formatDate(r.createdAt)}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

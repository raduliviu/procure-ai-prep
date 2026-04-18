import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
    CreateRequestBodySchema,
    PurchaseRequestSchema,
    type PurchaseRequest,
} from '@procure/shared';
import { api, ApiError } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const MAX_CHARS = 5000;

export function NewRequest() {
    const [rawText, setRawText] = useState('');
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const createRequest = useMutation({
        mutationFn: (body: { rawText: string }) =>
            api.post<PurchaseRequest>('/api/requests', body, {
                parse: (data) => PurchaseRequestSchema.parse(data),
            }),
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: ['requests'] });
            navigate({ to: '/requests/$id', params: { id: data.id } });
        },
    });

    const isValid = CreateRequestBodySchema.safeParse({ rawText }).success;
    const errorMessage = createRequest.isError
        ? createRequest.error instanceof ApiError
            ? `${createRequest.error.status}: submission failed`
            : createRequest.error.message
        : null;

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (isValid) createRequest.mutate({ rawText });
                }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>New purchase request</CardTitle>
                        <CardDescription>
                            Describe what you need in plain English. The AI triage will
                            extract category, estimated spend, urgency, and suggested
                            vendors.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            <Label htmlFor="rawText">Purchase request</Label>
                            <Textarea
                                id="rawText"
                                value={rawText}
                                onChange={(e) => {
                                    setRawText(e.target.value);
                                }}
                                placeholder="e.g. Need 10 standing desks for the Berlin office, ideally from Flexispot. Budget around €4000, delivery by end of month."
                                rows={8}
                                maxLength={MAX_CHARS}
                                disabled={createRequest.isPending}
                            />
                            <p className="text-muted-foreground text-xs">
                                {rawText.length} / {MAX_CHARS}
                            </p>
                        </div>
                        {errorMessage && (
                            <p className="text-destructive mt-4 text-sm">{errorMessage}</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={!isValid || createRequest.isPending}>
                            {createRequest.isPending ? 'Submitting…' : 'Submit request'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}

import { z } from "zod";
import { TriageResultSchema, type TriageResult } from "@procure/shared";
import { openai, OPENAI_MODEL } from "./openai.js";

const SYSTEM_PROMPT = `You are a procurement triage assistant. Given a free-text purchase request from an employee, you extract structured fields. Be specific about vendors when the user names them; suggest 2-3 reasonable vendors when they don't. The confidence field reflects how clearly the raw request specifies each structured field — vague requests should produce lower confidence (e.g. 0.3), detailed requests with explicit vendors, amounts, and timelines should produce higher confidence (e.g. 0.9).`;

// Zod v4's native JSON Schema exporter. We build the schema once at
// module-load time rather than per-request.
const triageJsonSchema = z.toJSONSchema(TriageResultSchema, {
	// OpenAI strict mode requires additionalProperties:false and every
	// property listed in `required`; Zod v4's default output already
	// does both, but being explicit is cheap insurance.
	unrepresentable: "throw",
});

/**
 * Call the LLM to extract structured fields from a free-text purchase
 * request. Errors propagate to the caller (network failures, timeouts,
 * bad API keys, schema mismatches, etc.) — the POST handlers catch
 * them and leave the request in status=submitted so the user can
 * retry via the re-run endpoint.
 *
 * Uses OpenAI's Responses API (the recommended surface for new
 * projects; Chat Completions is still supported but legacy-shaped).
 */
export async function triageRequest(rawText: string): Promise<TriageResult> {
	const response = await openai.responses.create(
		{
			model: OPENAI_MODEL,
			input: [
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: rawText },
			],
			text: {
				format: {
					type: "json_schema",
					name: "triage_result",
					strict: true,
					schema: triageJsonSchema,
				},
			},
		},
		{
			// Cap any single call at 30s so a hanging OpenAI request
			// can't block the POST indefinitely.
			timeout: 30_000,
		},
	);

	// output_text is the raw JSON string. strict mode guarantees it
	// parses and conforms to the schema, but we re-validate with Zod
	// so a runtime mismatch fails loudly instead of silently passing
	// bad data to the DB.
	const content = response.output_text;
	if (!content) {
		throw new Error("OpenAI returned an empty response");
	}

	const parsed: unknown = JSON.parse(content);
	return TriageResultSchema.parse(parsed);
}

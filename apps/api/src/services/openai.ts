import OpenAI from "openai";

/**
 * Process-wide OpenAI client singleton. The SDK reads OPENAI_API_KEY
 * from `process.env` by default if we don't pass one; we pass it
 * explicitly here so the source of the key is obvious and so that
 * setups using a different env-var name still work.
 *
 * We intentionally do NOT throw at module load if the key is missing:
 * the triage service wraps every call in try/catch so a missing key
 * degrades gracefully to "status=submitted, triage failed" rather
 * than crashing the whole API.
 */
export const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

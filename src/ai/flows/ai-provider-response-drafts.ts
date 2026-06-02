'use server';
/**
 * @fileOverview A Genkit flow for generating professional response drafts for service providers.
 *
 * - aiProviderResponseDrafts - A function that generates response drafts based on seeker's needs and provider's services.
 * - AiProviderResponseDraftsInput - The input type for the aiProviderResponseDrafts function.
 * - AiProviderResponseDraftsOutput - The return type for the aiProviderResponseDrafts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiProviderResponseDraftsInputSchema = z.object({
  seekerRequest: z
    .string()
    .describe("The service seeker's request or inquiry, detailing their needs."),
  providerServices: z
    .string()
    .describe("A description of the service provider's available services and offerings."),
  providerBio: z
    .string()
    .optional()
    .describe(
      "An optional professional biography or summary of the service provider, to help tailor the response."
    ),
});
export type AiProviderResponseDraftsInput = z.infer<
  typeof AiProviderResponseDraftsInputSchema
>;

const AiProviderResponseDraftsOutputSchema = z.object({
  responseDraft: z.string().describe("A professional and helpful draft response to the service seeker."),
  confidenceScore: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe("The AI's confidence level (0-100) in the generated response draft."),
  suggestionsForImprovement: z
    .string()
    .optional()
    .describe(
      "Suggestions for the service provider to further improve or personalize the drafted response."
    ),
});
export type AiProviderResponseDraftsOutput = z.infer<
  typeof AiProviderResponseDraftsOutputSchema
>;

export async function aiProviderResponseDrafts(
  input: AiProviderResponseDraftsInput
): Promise<AiProviderResponseDraftsOutput> {
  return aiProviderResponseDraftsFlow(input);
}

const responseDraftPrompt = ai.definePrompt({
  name: 'responseDraftPrompt',
  input: {schema: AiProviderResponseDraftsInputSchema},
  output: {schema: AiProviderResponseDraftsOutputSchema},
  prompt: `You are an AI assistant specialized in drafting professional and helpful responses for service providers to their potential clients.

Your goal is to create a draft response that addresses the seeker's needs, highlights relevant aspects of the provider's services, and maintains a professional tone.

Provider's professional summary (if available, use this to personalize the response):
{{#if providerBio}}
{{{providerBio}}}
{{else}}
N/A
{{/if}}

Provider's Services:
{{{providerServices}}}

Service Seeker's Request:
{{{seekerRequest}}}

Based on the above information, draft a professional response. Also, provide a confidence score (0-100) for your draft and any suggestions for the provider to improve it.
`,
});

const aiProviderResponseDraftsFlow = ai.defineFlow(
  {
    name: 'aiProviderResponseDraftsFlow',
    inputSchema: AiProviderResponseDraftsInputSchema,
    outputSchema: AiProviderResponseDraftsOutputSchema,
  },
  async input => {
    const {output} = await responseDraftPrompt(input);
    return output!;
  }
);

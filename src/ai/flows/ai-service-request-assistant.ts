'use server';
/**
 * @fileOverview An AI assistant flow to help service seekers refine their service request descriptions.
 *
 * - refineServiceRequestDescription - A function that refines a service request description.
 * - AiServiceRequestAssistantInput - The input type for the refineServiceRequestDescription function.
 * - AiServiceRequestAssistantOutput - The return type for the refineServiceRequestDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiServiceRequestAssistantInputSchema = z.object({
  rawDescription: z
    .string()
    .describe("The user's initial, unrefined service request description."),
  serviceCategory: z
    .string()
    .optional()
    .describe(
      'The category of the service request (e.g., "Plumbing", "Web Development").'
    ),
});
export type AiServiceRequestAssistantInput = z.infer<
  typeof AiServiceRequestAssistantInputSchema
>;

const AiServiceRequestAssistantOutputSchema = z.object({
  refinedDescription: z
    .string()
    .describe('The AI-enhanced and refined service request description.'),
});
export type AiServiceRequestAssistantOutput = z.infer<
  typeof AiServiceRequestAssistantOutputSchema
>;

export async function refineServiceRequestDescription(
  input: AiServiceRequestAssistantInput
): Promise<AiServiceRequestAssistantOutput> {
  return aiServiceRequestAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiServiceRequestAssistantPrompt',
  input: {schema: AiServiceRequestAssistantInputSchema},
  output: {schema: AiServiceRequestAssistantOutputSchema},
  prompt: `You are an AI assistant specialized in refining service request descriptions for clarity and completeness. Your goal is to help service seekers articulate their needs so that service providers can easily understand and provide accurate proposals.

Given the following raw service request and its category, rephrase and expand upon it to make it clear, concise, and comprehensive. Ensure all necessary details a provider might need are either present or suggested to be added. If the raw description is vague, try to make it more specific and actionable. Maintain a professional and polite tone.

Raw Description: {{{rawDescription}}}
{{#if serviceCategory}}Service Category: {{{serviceCategory}}}{{/if}}

Please provide the refined description.`,
});

const aiServiceRequestAssistantFlow = ai.defineFlow(
  {
    name: 'aiServiceRequestAssistantFlow',
    inputSchema: AiServiceRequestAssistantInputSchema,
    outputSchema: AiServiceRequestAssistantOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

'use server';
/**
 * @fileOverview An AI agent for generating and refining professional biographies for service providers.
 *
 * - generateProviderBio - A function that handles the bio generation process.
 * - AiProviderBioGeneratorInput - The input type for the generateProviderBio function.
 * - AiProviderBioGeneratorOutput - The return type for the generateProviderBio function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiProviderBioGeneratorInputSchema = z.object({
  experience: z.string().describe('A detailed description of the service provider\'s professional experience.'),
  serviceCategories: z.array(z.string()).describe('A list of service categories the provider specializes in.'),
});
export type AiProviderBioGeneratorInput = z.infer<typeof AiProviderBioGeneratorInputSchema>;

const AiProviderBioGeneratorOutputSchema = z.object({
  generatedBio: z.string().describe('A professionally written biography for the service provider.'),
});
export type AiProviderBioGeneratorOutput = z.infer<typeof AiProviderBioGeneratorOutputSchema>;

export async function generateProviderBio(input: AiProviderBioGeneratorInput): Promise<AiProviderBioGeneratorOutput> {
  return aiProviderBioGeneratorFlow(input);
}

const providerBioPrompt = ai.definePrompt({
  name: 'providerBioPrompt',
  input: { schema: AiProviderBioGeneratorInputSchema },
  output: { schema: AiProviderBioGeneratorOutputSchema },
  prompt: `You are an expert professional biography writer. Your task is to create a compelling and concise biography for a service provider.

Based on the following information, generate a professional biography that highlights their skills, experience, and value proposition.

Service Provider's Experience: {{{experience}}}
Service Categories: {{#each serviceCategories}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Ensure the biography is engaging, professional, and suitable for a service marketplace profile. Keep it under 200 words and focus on attracting potential clients.`,
});

const aiProviderBioGeneratorFlow = ai.defineFlow(
  {
    name: 'aiProviderBioGeneratorFlow',
    inputSchema: AiProviderBioGeneratorInputSchema,
    outputSchema: AiProviderBioGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await providerBioPrompt(input);
    return output!;
  }
);

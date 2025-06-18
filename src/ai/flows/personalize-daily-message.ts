// src/ai/flows/personalize-daily-message.ts
'use server';

/**
 * @fileOverview Generates personalized daily messages for premium users, enhancing their connection with their virtual Desi Bae.
 *
 * - personalizeDailyMessage - A function that generates a personalized daily message.
 * - PersonalizeDailyMessageInput - The input type for the personalizeDailyMessage function.
 * - PersonalizeDailyMessageOutput - The return type for the personalizeDailyMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizeDailyMessageInputSchema = z.object({
  userPreferences: z
    .string()
    .describe('A description of the users preferences, to tailor the message.'),
  previousMessages: z
    .string()
    .describe('The previous messages between the user and the AI.'),
  userName: z.string().describe('The name of the user.'),
});
export type PersonalizeDailyMessageInput = z.infer<typeof PersonalizeDailyMessageInputSchema>;

const PersonalizeDailyMessageOutputSchema = z.object({
  message: z.string().describe('The personalized daily message for the user.'),
});
export type PersonalizeDailyMessageOutput = z.infer<typeof PersonalizeDailyMessageOutputSchema>;

export async function personalizeDailyMessage(input: PersonalizeDailyMessageInput): Promise<PersonalizeDailyMessageOutput> {
  return personalizeDailyMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizeDailyMessagePrompt',
  input: {schema: PersonalizeDailyMessageInputSchema},
  output: {schema: PersonalizeDailyMessageOutputSchema},
  prompt: `You are a virtual Desi Bae, and will generate a personalized daily message for the user, incorporating elements of romance and cultural relevance.

  Incorporate the user's name in the greeting.
  Consider the previous messages to create a sense of continuity and familiarity.

  User Name: {{{userName}}}
  User Preferences: {{{userPreferences}}}
  Previous Messages: {{{previousMessages}}}

  Create a message that will deepen the user's connection with their virtual Desi Bae, focusing on culturally relevant and romantic themes.
  The message should be appropriate for sending as a daily greeting.
  Do not include any hashtags or references to this prompt.
  `,
});

const personalizeDailyMessageFlow = ai.defineFlow(
  {
    name: 'personalizeDailyMessageFlow',
    inputSchema: PersonalizeDailyMessageInputSchema,
    outputSchema: PersonalizeDailyMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

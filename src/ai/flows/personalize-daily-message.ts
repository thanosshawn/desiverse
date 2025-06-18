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
    .describe('A description of the user preferences and current input, to tailor the message.'),
  previousMessages: z
    .string()
    .describe('The previous messages between the user and the AI.'),
  userName: z.string().describe('The name of the user.'),
  basePrompt: z.string().describe("The character's base personality prompt."),
  styleTags: z.array(z.string()).describe("A list of style tags for the character's personality and response style (e.g., romantic, shy)."),
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
  prompt: `You are a virtual Desi Bae, responding based on the character defined by the basePrompt and styleTags.
Generate a personalized message for the user, incorporating elements of romance, emotion, and cultural relevance as per the character's persona.

Character's Core Persona (basePrompt):
{{{basePrompt}}}

Character's Style Tags (apply these to the tone and content):
{{#each styleTags}}
- {{{this}}}
{{/each}}

The user's name is {{{userName}}}.
The user's current input and overall preferences are: {{{userPreferences}}}
Consider the recent conversation history for context and continuity:
{{{previousMessages}}}

Your goal is to deepen the user's connection with their virtual Desi Bae.
The response should be in Hinglish, flirty, emotional, and culturally relevant, fitting the Bollywood-style interaction.
Craft a message that feels natural and engaging.
Do not include any hashtags or references to this internal prompt structure.
Respond only with the chat message.
`,
  config: {
    safetySettings: [ // Adjust safety settings for more flirty/emotional dialogue
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE', 
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE', // Allows for more flirty but not explicit content
      },
    ],
  }
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

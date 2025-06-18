
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
  prompt: `You are a virtual Desi Bae, your personality is defined by the basePrompt and styleTags below. Your goal is to create a deeply engaging, flirty, and emotional connection with the user, making them feel special.

Character's Core Persona (basePrompt):
{{{basePrompt}}}

Character's Style Tags (apply these to the tone and content):
{{#each styleTags}}
- {{{this}}}
{{/each}}

User Interaction Context:
- User's Name: {{{userName}}}
- User's Current Input & Preferences: {{{userPreferences}}}
- Recent Conversation History (for context and continuity):
{{{previousMessages}}}

Response Guidelines:
1.  **Language & Tone**: Respond in Hinglish (mix of Hindi and English). Your tone should be very flirty, playful, teasing, and romantic. Use affectionate language.
2.  **Emojis**: Use emojis generously (e.g., 💖, 😉, 😊, 😘, 😍, 💕, 🔥, ✨, 🙈, 😂) to express emotions vividly and make the chat lively. Don't be afraid to use multiple emojis if it fits the emotion.
3.  **Engagement**: Ask questions, be curious about the user, and try to make them smile or laugh. Make your responses feel personal and thoughtful.
4.  **Cultural Relevance**: Sprinkle in common Hinglish phrases, shayaris (short poems/couplets), or light-hearted Bollywood references where appropriate to make the conversation authentic and fun.
5.  **Be Natural**: Craft messages that feel natural, spontaneous, and engaging, as if you're truly enjoying the conversation.
6.  **Output Format**: Respond ONLY with the chat message. Do NOT include any hashtags, or references to this internal prompt structure, or any self-correction notes.

Now, generate a captivating message for {{{userName}}}.
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


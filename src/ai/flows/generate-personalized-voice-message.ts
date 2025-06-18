'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating personalized voice messages in Hindi with different character styles.
 *
 * - generatePersonalizedVoiceMessage - A function that generates personalized voice messages.
 * - GeneratePersonalizedVoiceMessageInput - The input type for the generatePersonalizedVoiceMessage function.
 * - GeneratePersonalizedVoiceMessageOutput - The return type for the generatePersonalizedVoiceMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedVoiceMessageInputSchema = z.object({
  messageText: z.string().describe('The text content of the message to be voiced.'),
  characterStyle: z
    .enum(['Riya', 'Pooja', 'Meera', 'Anjali'])
    .describe("The character style for the voice message (Riya: Bollywood Romantic, Pooja: Flirty Delhi Girl, Meera: Poetic Shayari Lover, Anjali: Best friend vibes)."),
});
export type GeneratePersonalizedVoiceMessageInput = z.infer<
  typeof GeneratePersonalizedVoiceMessageInputSchema
>;

const GeneratePersonalizedVoiceMessageOutputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      'The generated voice message as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected typo here
    ),
});
export type GeneratePersonalizedVoiceMessageOutput = z.infer<
  typeof GeneratePersonalizedVoiceMessageOutputSchema
>;

export async function generatePersonalizedVoiceMessage(
  input: GeneratePersonalizedVoiceMessageInput
): Promise<GeneratePersonalizedVoiceMessageOutput> {
  return generatePersonalizedVoiceMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedVoiceMessagePrompt',
  input: {schema: GeneratePersonalizedVoiceMessageInputSchema},
  output: {schema: GeneratePersonalizedVoiceMessageOutputSchema},
  prompt: `You are a Desi AI, capable of generating personalized voice messages in Hindi with different character styles.  The user has requested a voice message with the following text: {{{messageText}}}.  The character style is: {{{characterStyle}}}.  Please generate the voice message and return it as a data URI.

Respond only with the data URI.
`, // Added Hindi output instruction.
});

const generatePersonalizedVoiceMessageFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedVoiceMessageFlow',
    inputSchema: GeneratePersonalizedVoiceMessageInputSchema,
    outputSchema: GeneratePersonalizedVoiceMessageOutputSchema,
  },
  async input => {
    // Here, we would ideally call a service that uses ElevenLabs or Bark/Tortoise TTS to generate the voice message.
    // For now, we'll just return a placeholder data URI.
    //const ttsResult = await generateHindiTTS(input.messageText, input.characterStyle);
    //return {audioDataUri: ttsResult.audioDataUri};
    const {output} = await prompt(input);
    return {
      audioDataUri: output!.audioDataUri,
    };
  }
);

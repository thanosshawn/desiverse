'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating short lip-synced video replies on a static avatar.
 *
 * - generateVideoReply - A function that generates a short lip-synced video reply.
 * - GenerateVideoReplyInput - The input type for the generateVideoReply function.
 * - GenerateVideoReplyOutput - The return type for the generateVideoReply function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVideoReplyInputSchema = z.object({
  message: z.string().describe('The message to be conveyed in the video reply.'),
  avatarDataUri: z
    .string()
    .describe(
      'The data URI of the static avatar image. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type GenerateVideoReplyInput = z.infer<typeof GenerateVideoReplyInputSchema>;

const GenerateVideoReplyOutputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      'The data URI of the generated video with lip-sync. Format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type GenerateVideoReplyOutput = z.infer<typeof GenerateVideoReplyOutputSchema>;

export async function generateVideoReply(
  input: GenerateVideoReplyInput
): Promise<GenerateVideoReplyOutput> {
  return generateVideoReplyFlow(input);
}

const generateVideoReplyPrompt = ai.definePrompt({
  name: 'generateVideoReplyPrompt',
  input: {schema: GenerateVideoReplyInputSchema},
  output: {schema: GenerateVideoReplyOutputSchema},
  prompt: `You are an AI assistant that generates short, lip-synced video replies using a static avatar.

  Create a video using the avatar provided and make it say: {{{message}}}

  The avatar is represented by the following data URI: {{media url=avatarDataUri}}.
  Return the generated video as a data URI.
  `,
});

const generateVideoReplyFlow = ai.defineFlow(
  {
    name: 'generateVideoReplyFlow',
    inputSchema: GenerateVideoReplyInputSchema,
    outputSchema: GenerateVideoReplyOutputSchema,
  },
  async input => {
    // Here, we directly call ai.generate to generate the image, and return its data URI.
    const {media} = await ai.generate({
      // IMPORTANT: ONLY the googleai/gemini-2.0-flash-exp model is able to generate images.
      model: 'googleai/gemini-2.0-flash-exp',

      prompt: [
        {media: {url: input.avatarDataUri}},
        {text: `Generate a short video of this avatar, lip-synced to the following message: ${input.message}`},
      ],

      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });

    return {videoDataUri: media.url!};
  }
);

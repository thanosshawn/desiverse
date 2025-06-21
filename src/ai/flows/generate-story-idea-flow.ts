'use server';
/**
 * @fileOverview A Genkit flow to generate unique, personalized story ideas for Desi romance.
 */

import { ai } from '@/ai/genkit';
import { GenerateStoryIdeaInputSchema, GenerateStoryIdeaOutputSchema, type GenerateStoryIdeaInput, type GenerateStoryIdeaOutput } from '@/lib/types';


export async function generateStoryIdea(input: GenerateStoryIdeaInput): Promise<GenerateStoryIdeaOutput> {
  return generateStoryIdeaFlow(input);
}


const storyIdeaPrompt = ai.definePrompt({
  name: 'generateStoryIdeaPrompt',
  input: { schema: GenerateStoryIdeaInputSchema },
  output: { schema: GenerateStoryIdeaOutputSchema },
  prompt: `You are a creative writer for a Desi romantic story app. Your task is to generate a unique, flirty, and emotionally engaging story idea centered around a specific character. The stories should often revolve around themes of secret affairs, forbidden love, college romance, and intense emotional connections, but can also be lighthearted.

The protagonist is:
- Name: {{{characterName}}}
- Personality: {{{characterPersonality}}}

Based on this character, create a compelling story premise.

Your output MUST be a JSON object that adheres to the provided schema, with the following fields:
1.  **title**: A very catchy and romantic title in English or Hinglish.
2.  **description**: A short, intriguing summary of the plot.
3.  **tagsString**: A comma-separated string of 3-5 relevant tags. Include tags like 'Romance', 'Secret Affair', 'College', 'Drama', 'Heartbreak', 'Mystery' where appropriate.
4.  **initialSceneSummary**: A detailed and immersive opening scene that the user will be dropped into. It should create immediate intrigue and prompt the user to act.

Make the story idea feel personalized to the character's personality. Be creative and bold!
`,
  config: {
    safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const generateStoryIdeaFlow = ai.defineFlow(
  {
    name: 'generateStoryIdeaFlow',
    inputSchema: GenerateStoryIdeaInputSchema,
    outputSchema: GenerateStoryIdeaOutputSchema,
  },
  async (input) => {
    const { output } = await storyIdeaPrompt(input);
    if (!output) {
      throw new Error("The AI failed to generate a story idea. Please try again.");
    }
    return output;
  }
);

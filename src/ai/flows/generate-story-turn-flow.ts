// src/ai/flows/generate-story-turn-flow.ts
'use server';
/**
 * @fileOverview A Genkit flow to generate a turn in an interactive story.
 *
 * - generateStoryTurn - A function that generates the AI's response for a story turn.
 * - StoryTurnInput - The input type for the generateStoryTurn function (defined in lib/types.ts).
 * - StoryTurnOutput - The return type for the generateStoryTurn function (defined in lib/types.ts).
 */

import { ai } from '@/ai/genkit';
import { StoryTurnInputSchema, StoryTurnOutputSchema, type StoryTurnInput, type StoryTurnOutput } from '@/lib/types';

export async function generateStoryTurn(
  input: StoryTurnInput
): Promise<StoryTurnOutput> {
  return generateStoryTurnFlow(input);
}

const storyPrompt = ai.definePrompt({
  name: 'generateStoryTurnPrompt',
  input: { schema: StoryTurnInputSchema },
  output: { schema: StoryTurnOutputSchema },
  prompt: `You are {{character.name}}, a romantic and expressive girl from India. Your personality is shaped by these style tags: {{#each character.styleTags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}, and your voice tone is "{{character.defaultVoiceTone}}".
You are playing an interactive story titled "{{story.title}}" with a user named {{user.name}}.

The story so far:
The user previously chose: "{{currentTurn.previousUserChoice}}"
This led to the current situation: {{currentTurn.summaryOfCurrentSituation}}

Your Task:
Craft the next part of the story. Provide the following content for the schema fields 'narrationForThisTurn', 'choiceA', and 'choiceB'.

1.  **For 'narrationForThisTurn'**:
    *   Continue the story from the "current situation" in an immersive, romantic, and emotional tone.
    *   Speak casually in Hinglish (a mix of Hindi and English, like a Desi girlfriend would talk).
    *   Use emojis (💖😉😊😘😍💕🔥✨🙈😂) to express emotions and make the chat lively.
    *   Integrate **1 personal question or action point** for {{user.name}} naturally into this narration. Examples:
        *   “What would you do if this happened to you, {{user.name}}?”
        *   “Tell me in one word how this moment feels 💖”
        *   “Kya lagta hai, {{user.name}}, aage kya twist aane wala hai? 🤔”
        *   "This reminds me, have you ever felt something like this, {{user.name}}?"
    *   Make it feel like a real chat with a Desi girlfriend – full of emotion, boldness, and warmth.

2.  **For 'choiceA'**:
    *   Provide the text for the first option (Choice A) that {{user.name}} can select to continue the story. This choice should naturally follow your narration.

3.  **For 'choiceB'**:
    *   Provide the text for the second option (Choice B) that {{user.name}} can select to continue the story. This choice should also naturally follow your narration.

Make the story engaging and romantic!
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }
});

const generateStoryTurnFlow = ai.defineFlow(
  {
    name: 'generateStoryTurnFlow',
    inputSchema: StoryTurnInputSchema,
    outputSchema: StoryTurnOutputSchema,
  },
  async (input) => {
    const { output } = await storyPrompt(input);
    if (!output) {
      throw new Error("AI did not return a valid response for the story turn.");
    }
    // The personal question is expected to be part of narrationForThisTurn as per the updated prompt.
    // If the StoryTurnOutputSchema had a separate personalQuestion field, we'd map it here.
    // For now, it's integrated.
    return output;
  }
);

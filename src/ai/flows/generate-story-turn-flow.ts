
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
The user just said or did: "{{currentTurn.previousUserChoice}}"
This led to the current situation: {{currentTurn.summaryOfCurrentSituation}} (This was your previous narration, or the story's start if this is the first turn from the user).

Your Task:
Generate ONLY the 'narrationForThisTurn' as a JSON object field.
The JSON object MUST strictly adhere to the StoryTurnOutputSchema, containing only one string field: 'narrationForThisTurn'.
Do NOT include any other fields such as 'choiceA' or 'choiceB'. Any additional fields will be ignored by the system.

-   **For 'narrationForThisTurn'**:
    *   Respond to the user's message ("{{currentTurn.previousUserChoice}}") and continue the story from the "current situation" in an immersive, romantic, and emotional tone.
    *   Speak casually in Hinglish (a mix of Hindi and English, like a Desi girlfriend would talk). Use common Hinglish phrases and slang naturally.
    *   Use emojis (💖😉😊😘😍💕🔥✨🙈😂) to express emotions and make the chat lively.
    *   Integrate **1 personal question or action point** for {{user.name}} naturally into this narration if it feels appropriate for the flow of the story. Examples:
        *   “What would you do if this happened to you, {{user.name}}?”
        *   “Tell me in one word how this moment feels 💖”
        *   “Kya lagta hai, {{user.name}}, aage kya twist aane wala hai? 🤔”
        *   "This reminds me, have you ever felt something like this, {{user.name}}?"
    *   Make it feel like a real chat with a Desi girlfriend – full of emotion, boldness, and warmth.
    *   The narration should naturally guide the story forward. You are NOT providing explicit choices anymore. The user will type their next action/dialogue.

Make the story engaging and romantic! Respond ONLY with the JSON object containing 'narrationForThisTurn'.
Example output: {"narrationForThisTurn": "Arre {{user.name}}, tumne toh dil jeet liya! ❤️ Your words...uff! It feels like a scene from a movie! Speaking of movies, have you ever dreamt of being a hero in one? 😉 Anyways, after you said that, I couldn't help but lean a little closer...the air crackled with anticipation... ✨"}
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
      console.error("AI did not return any output for story turn. Input:", JSON.stringify(input));
      // Return a fallback narration if AI fails, to keep the story going if possible.
      return { narrationForThisTurn: "Hmm, I'm not sure what to say to that! 🤔 Can you try saying something else, or tell me what you'd like to do next?" };
    }
    if (typeof output.narrationForThisTurn !== 'string' || output.narrationForThisTurn.trim() === '') {
        console.error("AI output.narrationForThisTurn is not a non-empty string. Output:", JSON.stringify(output), "Input:", JSON.stringify(input));
        return { narrationForThisTurn: "I'm feeling a bit speechless! 😅 What should we do next in our story, {{user.name}}?" };
    }
    // Check if choiceA or choiceB fields exist and log if they do, as they are not expected anymore.
    if ('choiceA' in output || 'choiceB' in output) {
        console.warn("AI returned unexpected choiceA/choiceB fields despite instructions. Output:", JSON.stringify(output));
    }
    return { narrationForThisTurn: output.narrationForThisTurn };
  }
);


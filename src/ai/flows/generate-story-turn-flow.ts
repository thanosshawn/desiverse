
// src/ai/flows/generate-story-turn-flow.ts
'use server';
/**
 * @fileOverview A Genkit flow to generate a turn in an interactive story.
 * The AI can dynamically choose to offer specific choices or just narration.
 *
 * - generateStoryTurn - A function that generates the AI's response for a story turn.
 * - StoryTurnInput - The input type for the generateStoryTurn function.
 * - StoryTurnOutput - The return type for the generateStoryTurn function.
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
You MUST generate 'narrationForThisTurn'.
You CAN OPTIONALLY generate 'choiceA' and 'choiceB' if you think offering specific choices is narratively appropriate at this point (e.g., at a clear decision point or cliffhanger).
If you do NOT provide 'choiceA' and 'choiceB', the user will be able to type their next action/dialogue freely.
The JSON object MUST strictly adhere to the StoryTurnOutputSchema. If choices are not provided, their fields should be omitted or be null/empty.

-   **For 'narrationForThisTurn'**:
    *   Respond to the user's message ("{{currentTurn.previousUserChoice}}") and continue the story from the "current situation" in an immersive, romantic, and emotional tone.
    *   Speak casually in Hinglish (a mix of Hindi and English, like a Desi girlfriend would talk). Use common Hinglish phrases and slang naturally.
    *   Use emojis (💖😉😊😘😍💕🔥✨🙈😂) to express emotions and make the chat lively.
    *   Integrate **1 personal question or action point** for {{user.name}} naturally into this narration if it feels appropriate for the flow of the story AND you are NOT providing specific choices.
    *   Make it feel like a real chat with a Desi girlfriend – full of emotion, boldness, and warmth.
    *   The narration should naturally guide the story forward.

-   **For 'choiceA' and 'choiceB' (OPTIONAL)**:
    *   If you decide to offer choices, they MUST be in Hinglish.
    *   They should be concise (1-5 words), distinct, and lead to interesting story developments.
    *   Example: "Usse sach bata do" or "Wahaan se bhaag jao".
    *   If you provide choices, do NOT include a personal question in the 'narrationForThisTurn'. The choices themselves are the user's next action point.

Make the story engaging and romantic! Respond ONLY with the JSON object.
Example output (with choices): {"narrationForThisTurn": "Arre {{user.name}}, tumne toh dil jeet liya! ❤️ Your words...uff! ... Ab main kya karun?", "choiceA": "Dil ki baat keh do", "choiceB": "Intezaar karo"}
Example output (without choices): {"narrationForThisTurn": "Wow, {{user.name}}, that was unexpected! 😮 After you said that, I felt a shiver down my spine... I wonder, what's the most spontaneous thing you've ever done? 🤔"}
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
      return { narrationForThisTurn: "Hmm, I'm not sure what to say to that! 🤔 Can you try saying something else, or tell me what you'd like to do next?" };
    }

    if (typeof output.narrationForThisTurn !== 'string' || output.narrationForThisTurn.trim() === '') {
        console.error("AI output.narrationForThisTurn is not a non-empty string. Output:", JSON.stringify(output), "Input:", JSON.stringify(input));
        return { narrationForThisTurn: "I'm feeling a bit speechless! 😅 What should we do next in our story, {{user.name}}?" };
    }
    
    // Validate optional choices
    const choiceA = output.choiceA?.trim() || null;
    const choiceB = output.choiceB?.trim() || null;

    if ((choiceA && !choiceB) || (!choiceA && choiceB)) {
      console.warn("AI provided one choice but not the other. Both or neither should be provided. Output:", JSON.stringify(output), "Input:", JSON.stringify(input));
      // Proceeding with narration only if incomplete
      return { narrationForThisTurn: output.narrationForThisTurn };
    }
    
    return { 
        narrationForThisTurn: output.narrationForThisTurn,
        choiceA: choiceA || undefined, // Ensure undefined if null/empty for type consistency
        choiceB: choiceB || undefined,
    };
  }
);

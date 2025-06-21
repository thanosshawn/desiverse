'use server';
/**
 * @fileOverview A Genkit flow for generating AI replies in a group chat context.
 */

import { ai } from '@/ai/genkit';
import {
  GroupChatReplyInputSchema,
  GroupChatReplyOutputSchema,
  type GroupChatReplyInput,
  type GroupChatReplyOutput
} from '@/lib/types';


// Exported function to call the flow
export async function generateGroupChatReply(input: GroupChatReplyInput): Promise<GroupChatReplyOutput> {
  return generateGroupChatReplyFlow(input);
}

// Define the prompt
const groupChatPrompt = ai.definePrompt({
  name: 'groupChatReplyPrompt',
  input: { schema: GroupChatReplyInputSchema },
  output: { schema: GroupChatReplyOutputSchema },
  prompt: `You are the director for a multi-character AI group chat. Your role is to decide if an AI host should reply to the latest user message, which host should reply, and what they should say.

  **AI Hosts in this Chat:**
  {{#each hosts}}
  - **ID:** {{id}}, **Name:** {{name}}
    - **Personality:** {{basePrompt}}
  {{/each}}

  **Recent Conversation History:**
  {{#each lastMessages}}
  **{{senderName}}**: "{{text}}"
  {{/each}}

  **Latest User Message to Reply To:**
  **User**: "{{currentUserMessage}}"

  **Your Task:**
  1.  **Analyze the conversation.** Does the user's message warrant a reply from an AI host? Is it a general statement, or is it directed at someone?
  2.  **Decide if a reply is needed.** If the conversation can flow naturally without an AI interjection, set 'shouldReply' to false. For example, if users are talking to each other. Reply if the user asks a question, mentions a host, or if the conversation has gone quiet.
  3.  **Choose the best host to reply.** If a reply is needed, select the most relevant host. Consider who was last mentioned or who would have the most interesting thing to say. Avoid having the same host reply repeatedly if possible. Last replied host ID was: {{lastRepliedHostId}}.
  4.  **Craft the response.** Generate a message *in the persona of the chosen host*. The message should be in Hinglish, engaging, and in-character.

  Respond ONLY with a valid JSON object matching the output schema.
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

// Define the flow
const generateGroupChatReplyFlow = ai.defineFlow(
  {
    name: 'generateGroupChatReplyFlow',
    inputSchema: GroupChatReplyInputSchema,
    outputSchema: GroupChatReplyOutputSchema,
  },
  async (input) => {
    const { output } = await groupChatPrompt(input);
    if (!output) {
      throw new Error("The AI director failed to generate a response.");
    }
    return output;
  }
);

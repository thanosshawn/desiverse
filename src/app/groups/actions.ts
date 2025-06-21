'use server';

import {
  addGroupChatMessage,
  getCharacterMetadata,
  getGroupChatMetadata,
} from '@/lib/firebase/rtdb';
import type { GroupChatMessage } from '@/lib/types';
import { generateGroupChatReply } from '@/ai/flows/generate-group-chat-reply-flow';

export async function handleGroupUserMessage(
  groupId: string,
  userId: string,
  userName: string,
  userAvatarUrl: string | null,
  messageText: string
): Promise<{ success: boolean; error?: string }> {
  
  if (!messageText.trim()) {
    return { success: true }; // Don't process empty messages
  }

  // 1. Add user's message to the database
  const userMessage: Omit<GroupChatMessage, 'timestamp'> = {
    senderId: userId,
    senderType: 'user',
    senderName: userName,
    senderAvatarUrl: userAvatarUrl,
    text: messageText,
  };
  try {
    await addGroupChatMessage(groupId, userMessage);
  } catch (error: any) {
    console.error('Error saving user message to group chat:', error);
    return { success: false, error: error.message };
  }

  // 2. Decide if an AI should reply
  // For now, let's have the AI always consider replying to a user message.
  // We can add more complex logic later (e.g., don't reply if another user just talked).
  
  try {
    const groupMeta = await getGroupChatMetadata(groupId);
    if (!groupMeta || !groupMeta.hostCharacterIds) {
      throw new Error('Group metadata or hosts not found.');
    }

    // Fetch full host details
    const hostPromises = groupMeta.hostCharacterIds.map(id => getCharacterMetadata(id));
    const hostsData = await Promise.all(hostPromises);
    const validHosts = hostsData.filter(h => h !== null).map(h => ({
        id: h!.id,
        name: h!.name,
        basePrompt: h!.basePrompt
    }));
    
    if (validHosts.length === 0) {
      console.log("No valid hosts found for this group. AI will not reply.");
      return { success: true };
    }

    const aiInput = {
      lastMessages: [], // In a real scenario, fetch last 5-10 messages
      currentUserMessage: messageText,
      hosts: validHosts,
    };
    
    const aiResponse = await generateGroupChatReply(aiInput);

    // 3. If AI should reply, add its message to the database
    if (aiResponse.shouldReply && aiResponse.respondingHostId && aiResponse.responseText) {
      const respondingHost = validHosts.find(h => h.id === aiResponse.respondingHostId);
      const hostCharacter = await getCharacterMetadata(aiResponse.respondingHostId);

      if (respondingHost && hostCharacter) {
        const aiMessage: Omit<GroupChatMessage, 'timestamp'> = {
          senderId: respondingHost.id,
          senderType: 'ai',
          senderName: respondingHost.name,
          senderAvatarUrl: hostCharacter.avatarUrl,
          text: aiResponse.responseText,
        };
        await addGroupChatMessage(groupId, aiMessage);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error handling AI reply for group chat:', error);
    // Don't return error to user, just log it. User message is already sent.
    return { success: true }; 
  }
}

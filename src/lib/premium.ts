// src/lib/premium.ts
import type { UserProfile, PremiumFeature as PremiumFeatureType } from '@/lib/types';

export type PremiumFeature = PremiumFeatureType; // Re-export for convenience if needed elsewhere

/**
 * Checks if a specific premium feature is locked for the user.
 * @param feature The premium feature to check.
 * @param userSubscriptionTier The user's current subscription tier.
 * @param options Additional context, like whether the character or gift is premium.
 * @returns True if the feature is locked, false otherwise.
 */
export function isFeatureLocked(
  feature: PremiumFeature,
  userSubscriptionTier: UserProfile['subscriptionTier'] | undefined,
  options?: {
    characterIsPremium?: boolean;
    // In the future, could add: giftIsPremium?: boolean;
  }
): boolean {
  // If subscription tier is unknown, treat as 'free' for safety to lock features.
  const effectiveTier = userSubscriptionTier || 'free';

  if (effectiveTier === 'premium' || effectiveTier === 'spicy') {
    return false; // Premium users have access to all listed features.
  }

  // At this point, user is on 'free' tier.
  switch (feature) {
    case 'premium_character_chat':
      // Locked if the character itself is marked as premium.
      return !!options?.characterIsPremium;
    case 'premium_voice_message':
      // Voice messages with premium characters are locked for free users.
      return !!options?.characterIsPremium;
    case 'premium_gift':
      // Currently, all gifts are considered premium for free users.
      // This could be expanded if individual gifts had their own `isPremium` flags
      // and you wanted to check: return !!options?.giftIsPremium;
      return true; 
    default:
      // Should not happen if PremiumFeature type is used correctly.
      console.warn('Unknown premium feature checked:', feature);
      return false; 
  }
}

/**
 * Gets standardized messaging and subscription redirect details for a locked feature.
 * @param feature The premium feature that is locked.
 * @param options Context like character name or item name.
 * @returns An object with title, description, and a query string for the /subscribe page.
 */
export function getFeatureLockDetails(
  feature: PremiumFeature,
  options?: {
    characterName?: string;
    itemName?: string; // e.g., gift name
  }
): { title: string; description: string; subscribeQuery: string } {
  const { characterName = 'your Bae', itemName } = options || {};
  
  switch (feature) {
    case 'premium_character_chat':
      return {
        title: `Unlock Full Chat with ${characterName} 💎`,
        description: `Full chat interaction with ${characterName} is a premium feature. Upgrade to dive deeper!`,
        subscribeQuery: `feature=Premium+Chat&characterName=${encodeURIComponent(characterName)}`,
      };
    case 'premium_voice_message':
      return {
        title: `Unlock Voice Messages with ${characterName} 🎤`,
        description: `Hearing ${characterName}'s voice messages is a premium experience. Please upgrade your plan.`,
        subscribeQuery: `feature=Voice+Messages&characterName=${encodeURIComponent(characterName)}`,
      };
    case 'premium_gift':
      const giftName = itemName || 'this gift';
      return {
        title: `Send ${itemName ? itemName : 'Premium Gifts'}! 🎁`,
        description: `Sending ${giftName} and other special gifts to ${characterName} is a premium feature. Spoil them by upgrading!`,
        subscribeQuery: `feature=Premium+Gifts&itemName=${encodeURIComponent(itemName || 'special_gift')}&characterName=${encodeURIComponent(characterName)}`,
      };
    default:
      return {
        title: 'Premium Feature Locked 💎',
        description: 'This feature requires a premium subscription. Please upgrade to enjoy!',
        subscribeQuery: 'feature=Premium+Access',
      };
  }
}

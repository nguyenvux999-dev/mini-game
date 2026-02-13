// src/engines/RandomEngine.ts
// Weighted Random Algorithm - Random theo trọng số probability

/**
 * Reward item với probability
 */
interface WeightedItem {
  id: number;
  probability: number; // 0-100
  remainingQty: number | null; // null = unlimited
  isActive: boolean;
}

/**
 * Random Engine
 * Implements weighted random selection algorithm
 */
export class RandomEngine {
  /**
   * Select a random item based on weighted probabilities
   * 
   * Algorithm:
   * 1. Filter items that are active and have remaining quantity
   * 2. Calculate total weight
   * 3. Generate random number between 0 and total weight
   * 4. Find the item where cumulative weight exceeds random number
   * 
   * @param items - Array of items with probability weights
   * @returns Selected item or null if no valid items
   */
  static selectWeighted<T extends WeightedItem>(items: T[]): T | null {
    // Filter valid items (active and has remaining quantity)
    const validItems = items.filter((item) => {
      if (!item.isActive) return false;
      if (item.remainingQty !== null && item.remainingQty <= 0) return false;
      return true;
    });

    if (validItems.length === 0) {
      return null;
    }

    // Calculate total weight
    const totalWeight = validItems.reduce((sum, item) => sum + item.probability, 0);

    if (totalWeight <= 0) {
      return null;
    }

    // Generate random number between 0 and totalWeight
    const random = Math.random() * totalWeight;

    // Find the selected item
    let cumulativeWeight = 0;
    for (const item of validItems) {
      cumulativeWeight += item.probability;
      if (random < cumulativeWeight) {
        return item;
      }
    }

    // Fallback to last valid item (edge case due to floating point)
    return validItems[validItems.length - 1];
  }

  /**
   * Check if player wins based on overall win probability
   * This is used when we want to first determine win/lose,
   * then select which reward if won
   * 
   * @param winProbability - Overall win probability (0-100)
   * @returns true if player wins
   */
  static checkWin(winProbability: number): boolean {
    if (winProbability <= 0) return false;
    if (winProbability >= 100) return true;
    return Math.random() * 100 < winProbability;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   * Useful for memory game card shuffling
   * 
   * @param array - Array to shuffle
   * @returns New shuffled array
   */
  static shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Generate random integer between min and max (inclusive)
   * 
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random integer
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Select N random items from array without replacement
   * 
   * @param items - Source array
   * @param n - Number of items to select
   * @returns Array of selected items
   */
  static selectRandom<T>(items: T[], n: number): T[] {
    const shuffled = this.shuffle(items);
    return shuffled.slice(0, Math.min(n, items.length));
  }
}

export default RandomEngine;

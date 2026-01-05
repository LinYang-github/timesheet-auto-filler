import { StandardEntry, CorpusEntry, GeneratedEntry, AppConfig } from '../types';

/**
 * Helper to get all Saturdays in a specific month of a year.
 */
const getSaturdays = (year: number, month: number): Date[] => {
  const saturdays: Date[] = [];
  const date = new Date(year, month - 1, 1); // Month is 0-indexed in JS

  // Advance to first Saturday
  while (date.getDay() !== 6) {
    date.setDate(date.getDate() + 1);
  }

  // Collect all Saturdays in the month
  while (date.getMonth() === month - 1) {
    saturdays.push(new Date(date));
    date.setDate(date.getDate() + 7);
  }

  return saturdays;
};

/**
 * Helper to get all days in a specific month, categorized.
 */
const getDaysInMonth = (year: number, month: number): { weekdays: Date[], weekends: Date[] } => {
  const weekdays: Date[] = [];
  const weekends: Date[] = [];
  const date = new Date(year, month - 1, 1);

  while (date.getMonth() === month - 1) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekends.push(new Date(date));
    } else {
      weekdays.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }

  return { weekdays, weekends };
};

/**
 * Helper to format date as YYYY-MM-DD
 */
const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Helper to get a random item from array
 */
const getRandomItem = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Helper to shuffle an array (Fisher-Yates shuffle)
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

/**
 * Distributes a total amount into 'count' parts with randomness,
 * respecting a maximum value per part.
 * (Used for Weekly mode)
 */
const distributeRandomly = (total: number, count: number, max: number): number[] => {
  if (count <= 0) return [];
  
  if (total >= count * max) {
    return new Array(count).fill(max);
  }

  // 1. Generate random weights
  const weights = Array.from({ length: count }, () => 0.7 + Math.random() * 0.6);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  // 2. Initial allocation
  let allocations = weights.map(w => (w / weightSum) * total);

  // 3. Iteratively fix violations
  for (let iter = 0; iter < 10; iter++) {
    let excess = 0;
    let underMaxIndices: number[] = [];

    allocations = allocations.map((val, idx) => {
      if (val > max) {
        excess += val - max;
        return max;
      } else {
        if (val < max) underMaxIndices.push(idx);
        return val;
      }
    });

    if (excess < 0.001) break;
    if (underMaxIndices.length === 0) break;

    const addPerItem = excess / underMaxIndices.length;
    underMaxIndices.forEach(idx => {
      allocations[idx] += addPerItem;
    });
  }

  // 4. Final rounding
  allocations = allocations.map(n => Math.floor(n * 100) / 100);
  
  let currentSum = allocations.reduce((sum, n) => sum + n, 0);
  let remainder = total - currentSum;

  let attempts = 0;
  while (remainder > 0.009 && attempts < 100) {
    const idx = Math.floor(Math.random() * count);
    if (allocations[idx] < max) {
      allocations[idx] = Math.round((allocations[idx] + 0.01) * 100) / 100;
      remainder -= 0.01;
    }
    attempts++;
  }
  
  return allocations;
};

/**
 * Main generation logic.
 */
export const generateTimesheets = (
  standardData: StandardEntry[],
  corpusData: CorpusEntry[],
  config: AppConfig
): GeneratedEntry[] => {
  const results: GeneratedEntry[] = [];

  standardData.forEach((entry) => {
    // Safety check
    if (entry.standardDays <= 0) return;

    if (config.generationMode === 'weekly') {
      // ---------------------------------------------------------
      // Weekly Mode: Distribute randomly across all Saturdays
      // ---------------------------------------------------------
      const saturdays = getSaturdays(entry.year, entry.month);
      if (saturdays.length === 0) return;

      const allocations = distributeRandomly(
        entry.standardDays, 
        saturdays.length, 
        config.maxWeeklyDays
      );

      saturdays.forEach((date, index) => {
        addResultRow(results, date, allocations[index], entry, corpusData);
      });

    } else {
      // ---------------------------------------------------------
      // Daily Mode: Fill full days (1.0) preferentially
      // Priority: Random Weekdays > Random Weekends
      // ---------------------------------------------------------
      const { weekdays, weekends } = getDaysInMonth(entry.year, entry.month);
      
      // Shuffle candidates to avoid filling only the first few days of the month
      const candidates = [
        ...shuffleArray(weekdays),
        ...shuffleArray(weekends)
      ];

      let remainingWork = entry.standardDays;
      const maxPerDay = 1.0; 

      // Iterate through candidates and fill them up "greedily"
      for (const date of candidates) {
        if (remainingWork <= 0.009) break; // Finished

        // Decide hours for this day: try to take 1.0, otherwise take whatever is left
        let daysToBook = remainingWork >= maxPerDay ? maxPerDay : remainingWork;
        
        // Round to 2 decimals
        daysToBook = Math.floor(daysToBook * 100) / 100;

        if (daysToBook > 0) {
          addResultRow(results, date, daysToBook, entry, corpusData);
          remainingWork -= daysToBook;
        }
      }
    }
  });

  // Sort results by date chronologically so the Excel looks organized
  // despite the random filling logic
  return results.sort((a, b) => new Date(a.日期).getTime() - new Date(b.日期).getTime());
};

const addResultRow = (
  results: GeneratedEntry[], 
  date: Date, 
  days: number, 
  entry: StandardEntry, 
  corpusData: CorpusEntry[]
) => {
  if (days <= 0) return;

  const corpusItem = corpusData.length > 0 
    ? getRandomItem(corpusData) 
    : { type: '默认', content: '无语料数据' };

  results.push({
    姓名: entry.name,
    日期: formatDate(date),
    年份: entry.year,
    月份: entry.month,
    工时类型: corpusItem.type,
    工作内容: corpusItem.content,
    消耗天数: days,
  });
};
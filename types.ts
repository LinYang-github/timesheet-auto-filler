export interface StandardEntry {
  name: string;
  year: number;
  month: number;
  standardMonths: number; // Raw value from Excel
  standardDays: number;   // Calculated: months * 21.75
}

export interface CorpusEntry {
  type: string;    // 工时类型
  content: string; // 工作内容
}

export interface GeneratedEntry {
  姓名: string;
  日期: string;
  年份: number;
  月份: number;
  工时类型: string;
  工作内容: string;
  消耗天数: number;
}

export type GenerationMode = 'weekly' | 'daily';

export interface AppConfig {
  standardDayMultiplier: number; // Default 21.75
  maxWeeklyDays: number;         // Default 6 (Weekly mode only)
  generationMode: GenerationMode; // New: 'weekly' or 'daily'
}
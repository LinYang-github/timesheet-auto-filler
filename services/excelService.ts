import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';
import { StandardEntry, CorpusEntry, GeneratedEntry } from '../types';

/**
 * Reads the Standard Hours Excel file.
 * Expects sheets named by year (e.g., "2020", "2021").
 * Expects columns: "姓名", and columns containing "1月"..."12月" (or just numbers).
 */
export const readStandardData = async (file: File, multiplier: number): Promise<StandardEntry[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const result: StandardEntry[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          // Attempt to parse year from sheet name
          const year = parseInt(sheetName);
          if (isNaN(year)) return; // Skip non-year sheets

          const worksheet = workbook.Sheets[sheetName];
          // Read as array of objects
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

          jsonData.forEach((row) => {
            const name = row['姓名'] || row['Name'];
            if (!name) return;

            // Iterate over keys to find months
            Object.keys(row).forEach((key) => {
              if (key === '姓名' || key === 'Name') return;

              // Extract month number from key (e.g., "1月" -> 1, "1" -> 1)
              const monthMatch = key.match(/(\d+)/);
              if (monthMatch) {
                const month = parseInt(monthMatch[1]);
                const val = parseFloat(row[key]);

                if (month >= 1 && month <= 12 && !isNaN(val)) {
                  result.push({
                    name,
                    year,
                    month,
                    standardMonths: val,
                    standardDays: val * multiplier,
                  });
                }
              }
            });
          });
        });

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

/**
 * Reads the Corpus Excel file.
 * Expects columns: "工时类型", "工作内容".
 */
export const readCorpusData = async (file: File): Promise<CorpusEntry[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Use the first sheet or find 'Sheet2' as per requirements
        let sheetName = workbook.SheetNames.find(n => n === 'Sheet2');
        if (!sheetName) sheetName = workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
        
        const result: CorpusEntry[] = jsonData.map((row) => ({
          type: row['工时类型'] || '常规工作',
          content: row['工作内容'] || '日常事务处理',
        })).filter(item => item.content); // Filter out empty rows

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

/**
 * Exports generated data to Excel.
 */
export const exportToExcel = (data: GeneratedEntry[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'GeneratedData');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  FileSaver.saveAs(blob, filename);
};
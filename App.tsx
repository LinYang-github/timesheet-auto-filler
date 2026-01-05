import React, { useState } from 'react';
import { FileSpreadsheet, Play, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ConfigPanel from './components/ConfigPanel';
import { readStandardData, readCorpusData, exportToExcel } from './services/excelService';
import { generateTimesheets } from './services/generatorService';
import { AppConfig, StandardEntry, CorpusEntry } from './types';

function App() {
  const [standardFile, setStandardFile] = useState<File | null>(null);
  const [corpusFile, setCorpusFile] = useState<File | null>(null);
  
  const [config, setConfig] = useState<AppConfig>({
    standardDayMultiplier: 21.75,
    maxWeeklyDays: 6.0,
    generationMode: 'weekly' // Default value
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({
    type: 'idle',
    message: ''
  });
  
  const [generatedCount, setGeneratedCount] = useState(0);

  const handleProcess = async () => {
    if (!standardFile || !corpusFile) {
      setStatus({ type: 'error', message: '请先上传所需文件' });
      return;
    }

    setIsProcessing(true);
    setStatus({ type: 'idle', message: '' });

    try {
      // 1. Read Data
      const standardData = await readStandardData(standardFile, config.standardDayMultiplier);
      const corpusData = await readCorpusData(corpusFile);

      if (standardData.length === 0) {
        throw new Error("未能从标准工时文件中解析出有效数据。请检查Sheet名称是否为年份（如2022）。");
      }
      if (corpusData.length === 0) {
        throw new Error("未能从语料文件中解析出有效数据。请检查是否有工时类型和工作内容列。");
      }

      // 2. Generate Logic
      const results = generateTimesheets(standardData, corpusData, config);
      setGeneratedCount(results.length);

      // 3. Export
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      exportToExcel(results, `工时填报补充数据_${timestamp}.xlsx`);

      setStatus({ 
        type: 'success', 
        message: `处理成功！已生成 ${results.length} 条数据并开始下载。` 
      });

    } catch (error: any) {
      console.error(error);
      setStatus({ 
        type: 'error', 
        message: error.message || '处理过程中发生未知错误，请检查文件格式。' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-indigo-700 text-white py-8 shadow-lg">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center gap-3 mb-2">
            <FileSpreadsheet className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight">智能工时填报生成器</h1>
          </div>
          <p className="text-indigo-100 opacity-90">
            基于标准月工时与语料库，自动计算并填充每周实际工时报表。
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-5xl mt-8 space-y-8">
        
        {/* Step 1: Uploads */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">1</span>
            数据导入
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUpload
              label="1. 标准工时数据源"
              description="包含按年份(2020, 2021...)命名的Sheet，列包含'姓名'及各月份数据"
              file={standardFile}
              onFileSelect={setStandardFile}
              onClear={() => setStandardFile(null)}
            />
            <FileUpload
              label="2. 工作内容语料库"
              description="包含'工时类型'和'工作内容'列的数据（通常在Sheet2）"
              file={corpusFile}
              onFileSelect={setCorpusFile}
              onClear={() => setCorpusFile(null)}
            />
          </div>
        </section>

        {/* Step 2: Config */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">2</span>
            参数配置
          </h2>
          <ConfigPanel config={config} setConfig={setConfig} />
        </section>

        {/* Step 3: Action */}
        <section>
          <div className="flex flex-col items-center justify-center py-6">
            <button
              onClick={handleProcess}
              disabled={isProcessing || !standardFile || !corpusFile}
              className={`
                group relative flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-semibold shadow-lg transition-all
                ${isProcessing || !standardFile || !corpusFile
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5'
                }
              `}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>正在处理数据...</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-current" />
                  <span>开始生成并下载</span>
                </>
              )}
            </button>
            
            <p className="mt-4 text-sm text-gray-500">
              点击后将自动计算并在浏览器中生成 Excel 文件
            </p>
          </div>
        </section>

        {/* Status Messages */}
        {status.type !== 'idle' && (
          <div className={`
            rounded-xl p-4 flex items-start gap-3 shadow-sm border
            ${status.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
          `}>
            {status.type === 'success' ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            )}
            <div>
              <h3 className={`font-semibold ${status.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {status.type === 'success' ? '处理完成' : '处理失败'}
              </h3>
              <p className={`text-sm mt-1 ${status.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {status.message}
              </p>
              {status.type === 'success' && (
                <div className="mt-2 flex items-center gap-2 text-xs font-medium text-green-800 opacity-80">
                  <Download className="w-4 h-4" />
                  文件应该已经开始下载。如果没有，请检查浏览器弹窗拦截。
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;

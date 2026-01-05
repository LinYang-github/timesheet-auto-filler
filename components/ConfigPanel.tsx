import React from 'react';
import { Settings, Calendar, List } from 'lucide-react';
import { AppConfig } from '../types';

interface ConfigPanelProps {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, setConfig }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
        <Settings className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">参数配置</h2>
      </div>
      
      <div className="space-y-6">
        {/* 生成模式选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">生成模式</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setConfig({ ...config, generationMode: 'weekly' })}
              className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-all ${
                config.generationMode === 'weekly'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                  : 'border-gray-200 hover:border-indigo-300 text-gray-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <div className="text-left">
                <div className="font-semibold text-sm">按周填报</div>
                <div className="text-xs opacity-70">每周一行 (周六)</div>
              </div>
            </button>

            <button
              onClick={() => setConfig({ ...config, generationMode: 'daily' })}
              className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-all ${
                config.generationMode === 'daily'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                  : 'border-gray-200 hover:border-indigo-300 text-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
              <div className="text-left">
                <div className="font-semibold text-sm">按天填报</div>
                <div className="text-xs opacity-70">每天一行 (优先工作日)</div>
              </div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标准天数系数 (天/月)
            </label>
            <p className="text-xs text-gray-500 mb-2">计算公式：标准月数 × 系数 = 目标工时</p>
            <input
              type="number"
              step="0.01"
              value={config.standardDayMultiplier}
              onChange={(e) => setConfig({ ...config, standardDayMultiplier: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {config.generationMode === 'weekly' ? '单行最大天数 (周)' : '单行最大天数 (日)'}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              {config.generationMode === 'weekly' 
                ? '每周六填报时，允许填写的最大天数' 
                : '按天填报时，每天允许填写的最大天数 (通常为1)'}
            </p>
            <input
              type="number"
              step={config.generationMode === 'weekly' ? "0.5" : "0.1"}
              value={config.generationMode === 'weekly' ? config.maxWeeklyDays : 1.0}
              disabled={config.generationMode === 'daily'} // Daily mode usually fixed to 1.0, or you can enable it
              onChange={(e) => setConfig({ ...config, maxWeeklyDays: parseFloat(e.target.value) || 0 })}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${config.generationMode === 'daily' ? 'bg-gray-100 text-gray-500' : ''}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
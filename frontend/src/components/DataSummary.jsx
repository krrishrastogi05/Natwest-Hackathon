import React, { useState } from 'react';
import { Table, BarChart3, Hash, Type, ToggleLeft, Calendar, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { formatFileSize } from '../utils/csvParser';

const TYPE_ICONS = { number: Hash, string: Type, boolean: ToggleLeft, date: Calendar };
const TYPE_COLORS = { number: 'number', string: 'string', boolean: 'boolean', date: 'date' };

export default function DataSummary({ data }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCol, setExpandedCol] = useState(null);
  if (!data) return null;

  const { summary, schema, headers, preview, fileName, fileSize } = data;
  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'schema', label: 'Schema', icon: Table },
    { key: 'preview', label: 'Preview', icon: Table },
  ];

  return (
    <div className="anim-fade-up space-y-4">
      {/* Header + Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity size={16} className="text-[#a78bfa]" />
          Data Summary
        </h3>
        <div className="flex rounded-xl overflow-hidden border border-[#2a2a4a]/50 bg-[#16162a]/50">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 text-[11px] font-medium flex items-center gap-1.5 transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-[#5b21b6]/15 text-[#a78bfa] border-b-2 border-[#7c3aed]'
                    : 'text-[#6a6a8a] hover:text-[#c8c8e0] hover:bg-[#2a2a4a]/30'
                }`}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Rows', value: summary.totalRows.toLocaleString(), color: '#a78bfa' },
          { label: 'Columns', value: summary.totalColumns, color: '#2dd4bf' },
          { label: 'Size', value: formatFileSize(fileSize), color: '#f472b6' },
          { label: 'File', value: fileName.length > 11 ? fileName.slice(0, 11) + '…' : fileName, color: '#fbbf24' },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <p className="text-[10px] font-semibold text-[#6a6a8a] uppercase tracking-wider">{stat.label}</p>
            <p className="text-base font-bold mt-0.5" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass rounded-xl overflow-hidden">
        {activeTab === 'overview' && (
          <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
            {headers.map((header, i) => {
              const colSummary = summary.columns[header];
              const isExpanded = expandedCol === header;
              const Icon = TYPE_ICONS[colSummary.type] || Type;
              return (
                <div key={header} className="rounded-xl bg-[#16162a]/50 border border-[#2a2a4a]/25 overflow-hidden">
                  <button
                    onClick={() => setExpandedCol(isExpanded ? null : header)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[#2a2a4a]/15 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`schema-badge ${TYPE_COLORS[colSummary.type]}`}>
                        <Icon size={11} />
                        {colSummary.type}
                      </span>
                      <span className="text-xs font-semibold text-white">{header}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#6a6a8a]">{colSummary.uniqueCount} unique</span>
                      {isExpanded ? <ChevronUp size={12} className="text-[#6a6a8a]" /> : <ChevronDown size={12} className="text-[#6a6a8a]" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-3.5 pb-3 pt-1 border-t border-[#2a2a4a]/25 anim-fade-in">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                        <StatItem label="Non-null" value={colSummary.nonNullCount} />
                        <StatItem label="Null" value={colSummary.nullCount} />
                        <StatItem label="Unique" value={colSummary.uniqueCount} />
                        {colSummary.type === 'number' && (
                          <>
                            <StatItem label="Min" value={colSummary.min} icon={<TrendingDown size={10} className="text-red-400" />} />
                            <StatItem label="Max" value={colSummary.max} icon={<TrendingUp size={10} className="text-green-400" />} />
                            <StatItem label="Mean" value={colSummary.mean} />
                            <StatItem label="Median" value={colSummary.median} />
                            <StatItem label="Std Dev" value={colSummary.stdDev} />
                          </>
                        )}
                      </div>
                      {colSummary.topValues && colSummary.topValues.length > 0 && (
                        <div className="mt-2.5">
                          <p className="text-[10px] font-semibold text-[#6a6a8a] mb-1.5">Top Values</p>
                          <div className="space-y-1">
                            {colSummary.topValues.map((tv, j) => {
                              const pct = (tv.count / summary.totalRows) * 100;
                              return (
                                <div key={j} className="flex items-center gap-2">
                                  <div className="flex-1 h-5 rounded bg-[#16162a]/60 overflow-hidden relative">
                                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#5b21b6]/15 to-transparent rounded" style={{ width: `${Math.max(pct, 3)}%` }} />
                                    <span className="relative z-10 px-2 text-[10px] text-[#c8c8e0] leading-5 truncate block">{tv.value}</span>
                                  </div>
                                  <span className="text-[10px] text-[#6a6a8a] w-14 text-right flex-shrink-0">{tv.count} ({pct.toFixed(1)}%)</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'schema' && (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>#</th><th>Column</th><th>Type</th><th>Non-Null</th><th>Null</th><th>Unique</th></tr></thead>
              <tbody>
                {headers.map((header, i) => {
                  const col = summary.columns[header];
                  const Icon = TYPE_ICONS[col.type] || Type;
                  return (
                    <tr key={header}>
                      <td className="text-[#6a6a8a] font-mono text-[11px]">{i + 1}</td>
                      <td className="font-medium text-white">{header}</td>
                      <td><span className={`schema-badge ${TYPE_COLORS[col.type]}`}><Icon size={11} />{col.type}</span></td>
                      <td className="font-mono text-[11px]">{col.nonNullCount}</td>
                      <td className="font-mono text-[11px]"><span className={col.nullCount > 0 ? 'text-amber-400' : 'text-[#6a6a8a]'}>{col.nullCount}</span></td>
                      <td className="font-mono text-[11px]">{col.uniqueCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="overflow-x-auto max-h-[300px]">
            <table className="data-table">
              <thead><tr><th className="text-center w-8">#</th>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    <td className="text-center text-[#6a6a8a] font-mono text-[11px]">{i + 1}</td>
                    {headers.map(h => <td key={h} className="max-w-[180px] truncate">{row[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {summary.totalRows > 10 && (
              <div className="px-4 py-2.5 text-center text-[10px] text-[#6a6a8a] border-t border-[#2a2a4a]/25">
                Showing first 10 of {summary.totalRows.toLocaleString()} rows
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatItem({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between bg-[#16162a]/50 rounded-lg px-2.5 py-1.5">
      <span className="text-[#6a6a8a] flex items-center gap-1">{icon}{label}</span>
      <span className="font-mono font-medium text-white">{value}</span>
    </div>
  );
}

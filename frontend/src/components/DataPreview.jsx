import React from 'react';
import { Table, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * DataPreview — Schema summary card shown after file upload (Task 12)
 * Shows: Column Name | Type | Sample Values | Missing %
 * Color-codes missing: green (0%), amber (1-10%), red (>10%)
 */
export default function DataPreview({ schema, summary, headers, rows }) {
  if (!headers || headers.length === 0) return null;

  // Get sample values (first 3 unique non-empty values)
  const getSampleValues = (header) => {
    const seen = new Set();
    const samples = [];
    for (let i = 0; i < Math.min(rows.length, 50); i++) {
      const val = rows[i][header];
      if (val !== '' && val !== null && val !== undefined && !seen.has(val)) {
        seen.add(val);
        samples.push(String(val).length > 20 ? String(val).slice(0, 20) + '…' : String(val));
        if (samples.length >= 3) break;
      }
    }
    return samples;
  };

  // Missing percentage color
  const getMissingColor = (pct) => {
    if (pct === 0) return { text: 'text-[#10b981]', bg: 'bg-[#10b981]' };
    if (pct <= 10) return { text: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]' };
    return { text: 'text-[#ef4444]', bg: 'bg-[#ef4444]' };
  };

  // Type styling
  const typeStyles = {
    number: { color: '#3b82f6', label: 'numeric' },
    string: { color: '#10b981', label: 'text' },
    boolean: { color: '#f59e0b', label: 'boolean' },
    date: { color: '#ec4899', label: 'date' },
  };

  return (
    <div className="rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[#111827]/60 animate-fade-in-up my-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
        <Table size={14} className="text-[#8b5cf6]" />
        <span className="text-xs font-semibold text-[#94a3b8]">Schema Overview</span>
        <span className="text-[10px] text-[#64748b] ml-1">{headers.length} columns</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[350px]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              <th className="px-4 py-2.5 text-left font-semibold text-[#64748b] uppercase text-[10px] tracking-wider bg-[#0f172a]/50 sticky top-0">#</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#64748b] uppercase text-[10px] tracking-wider bg-[#0f172a]/50 sticky top-0">Column</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#64748b] uppercase text-[10px] tracking-wider bg-[#0f172a]/50 sticky top-0">Type</th>
              <th className="px-4 py-2.5 text-left font-semibold text-[#64748b] uppercase text-[10px] tracking-wider bg-[#0f172a]/50 sticky top-0">Sample Values</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#64748b] uppercase text-[10px] tracking-wider bg-[#0f172a]/50 sticky top-0">Missing %</th>
            </tr>
          </thead>
          <tbody>
            {headers.map((header, i) => {
              const col = summary.columns[header];
              const missingPct = col ? Math.round((col.nullCount / summary.totalRows) * 100 * 10) / 10 : 0;
              const { text: missingTextColor, bg: missingBgColor } = getMissingColor(missingPct);
              const type = schema[header]?.type || 'string';
              const ts = typeStyles[type] || typeStyles.string;
              const samples = getSampleValues(header);

              return (
                <tr
                  key={header}
                  className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                >
                  <td className="px-4 py-2 text-[#4a4a6a] font-mono">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-white">{header}</td>
                  <td className="px-4 py-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                      style={{
                        color: ts.color,
                        backgroundColor: `${ts.color}12`,
                        border: `1px solid ${ts.color}25`,
                      }}
                    >
                      {ts.label}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {samples.map((s, j) => (
                        <span key={j} className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.04)] text-[#94a3b8] text-[10px] font-mono truncate max-w-[120px]">
                          {s}
                        </span>
                      ))}
                      {samples.length === 0 && (
                        <span className="text-[10px] text-[#4a4a6a] italic">no data</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Mini bar */}
                      <div className="w-12 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${missingBgColor}`}
                          style={{ width: `${Math.min(missingPct, 100)}%` }}
                        />
                      </div>
                      <span className={`font-mono font-medium ${missingTextColor} min-w-[36px]`}>
                        {missingPct === 0 ? (
                          <span className="flex items-center gap-0.5">
                            <CheckCircle size={9} />
                            0%
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5">
                            {missingPct > 10 && <AlertTriangle size={9} />}
                            {missingPct}%
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

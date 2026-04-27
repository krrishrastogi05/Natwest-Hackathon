import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

function getScoreColor(score) {
  if (score >= 75) return '#007a4d'; // NatWest green
  if (score >= 50) return '#b45309'; // NatWest amber
  return '#c0392b'; // NatWest red
}

function getScoreLabel(score) {
  if (score >= 75) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
}

export default function ConfidenceScore({ confidence }) {
  const [expanded, setExpanded] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  if (!confidence || typeof confidence !== 'object') return null;

  const score = confidence.overall ?? confidence.score ?? 0;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  // Animate the ring fill on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const b = confidence.breakdown || confidence;

  const breakdowns = [
    { label: 'Row Coverage', value: b.row_coverage ?? b.coverage ?? null },
    { label: 'Data Completeness', value: b.data_completeness ?? b.completeness ?? null },
    { label: 'Schema Match', value: b.schema_match ?? null },
    { label: 'Web Corroboration', value: b.web_corroboration ?? b.web_score ?? null },
  ].filter(b => b.value !== null && b.value !== undefined);

  return (
    <div className="my-3 rounded-xl border border-[rgba(95,33,128,0.18)] bg-[#1e0f30]/60 overflow-hidden animate-fade-in-up">
      {/* Main row */}
      <button
        onClick={() => breakdowns.length > 0 && setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-[rgba(95,33,128,0.06)] transition-colors"
      >
        {/* SVG Ring */}
        <div className="flex-shrink-0">
          <svg width="64" height="64" viewBox="0 0 80 80">
            {/* Background ring */}
            <circle
              cx="40" cy="40" r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="5"
            />
            {/* Animated progress ring */}
            <circle
              cx="40" cy="40" r={radius}
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="confidence-ring"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
            {/* Center text */}
            <text
              x="40" y="40"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="15"
              fontWeight="700"
              fontFamily="Inter, sans-serif"
            >
              {score}%
            </text>
          </svg>
        </div>

        {/* Label */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{score}%</span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                color,
                backgroundColor: `${color}15`,
                border: `1px solid ${color}30`,
              }}
            >
              {label}
            </span>
          </div>
          <p className="text-[11px] text-[#8b6fa8] mt-0.5">Confidence Score</p>
        </div>

        {/* Expand toggle */}
        {breakdowns.length > 0 && (
          <div className="text-[#7c5fa0]">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        )}
      </button>

      {/* Breakdown section */}
      {expanded && breakdowns.length > 0 && (
        <div className="px-4 pb-4 pt-1 border-t border-[rgba(95,33,128,0.15)] space-y-2.5">
          {breakdowns.map((item, i) => {
            const itemColor = getScoreColor(item.value);
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[#8b6fa8]">{item.label}</span>
                  <span className="text-[11px] font-semibold" style={{ color: itemColor }}>
                    {item.value}%
                  </span>
                </div>
                {/* Mini progress bar */}
                <div className="h-1.5 rounded-full bg-[rgba(95,33,128,0.1)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${item.value}%`,
                      backgroundColor: itemColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

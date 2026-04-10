import React from 'react';
import { Upload, BarChart3, Table2, BrainCircuit, Sparkles, Search, Zap, Database, TrendingUp, ShieldCheck } from 'lucide-react';

const FEATURES = [
  { icon: Upload, text: 'Upload Dataset', color: '#a78bfa', position: 'top-left' },
  { icon: BarChart3, text: 'Data Visualization', color: '#2dd4bf', position: 'top-right' },
  { icon: ShieldCheck, text: 'Smart Analysis', color: '#f472b6', position: 'mid-left' },
  { icon: TrendingUp, text: 'Trend Detection', color: '#fbbf24', position: 'mid-right' },
  { icon: Database, text: 'Schema Insights', color: '#60a5fa', position: 'bot-left' },
  { icon: Zap, text: 'Instant Results', color: '#34d399', position: 'bot-right' },
];

export default function WelcomeScreen({ onSuggestionClick }) {
  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden select-none">

      {/* Floating Feature Pills — positioned around the center */}
      <div className="absolute inset-0 pointer-events-none">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          const positions = {
            'top-left':  'top-[14%] left-[4%]',
            'top-right': 'top-[10%] right-[4%]',
            'mid-left':  'top-[44%] left-[1%]',
            'mid-right': 'top-[40%] right-[1%]',
            'bot-left':  'bottom-[18%] left-[5%]',
            'bot-right': 'bottom-[22%] right-[5%]',
          };
          return (
            <div
              key={i}
              className={`absolute ${positions[f.position]} pointer-events-auto anim-fade-up`}
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              <div className="feature-pill">
                <span className="pill-dot" style={{ background: f.color }} />
                <Icon size={14} style={{ color: f.color }} />
                <span>{f.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center max-w-xl w-full px-4">
        {/* Badge */}
        <div className="anim-fade-up mb-6" style={{ animationDelay: '0.1s' }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#5b21b6]/15 border border-[#5b21b6]/25 text-[#a78bfa]">
            <Sparkles size={12} />
            Smarter data, instant insights
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center mb-3 anim-fade-up" style={{ animationDelay: '0.15s' }}>
          <span className="text-white">Analyze Data —</span><br />
          <span className="gradient-text">Meet DataTalk</span>
        </h1>

        <p className="text-sm text-[#a0a0c0] text-center max-w-md mb-8 anim-fade-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
          Your AI-Powered Data Partner — Upload CSV files, explore schemas, and get instant analysis with visualizations.
        </p>

        {/* Central Input Card (MindSpark-inspired) */}
        <div
          className="w-full glass-strong rounded-2xl p-1.5 anim-scale-in"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="flex items-center gap-2 px-4 py-3.5 text-sm text-[#6a6a8a]">
            <Sparkles size={14} className="text-[#7c3aed] flex-shrink-0" />
            <span>Write any query or command to DataTalk</span>
          </div>

          <div className="border-t border-[#2a2a4a]/60 px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[
                { icon: Search, label: 'Search' },
                { icon: Upload, label: 'Upload CSV' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    onClick={() => onSuggestionClick && onSuggestionClick(item.label === 'Upload CSV' ? 'Upload a dataset to start' : 'Summarize my dataset')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#a0a0c0] hover:text-white hover:bg-[#2a2a4a]/50 transition-all duration-200"
                  >
                    <Icon size={13} />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => onSuggestionClick && onSuggestionClick('Summarize my dataset')}
              className="btn-primary text-xs !px-5 !py-2"
            >
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

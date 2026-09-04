import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Cpu, Play, BarChart3, Sparkles, Lock, Bot, Activity } from 'lucide-react';

const DEMO_VIDEO_SRC = '/demo.mp4';
const DEMO_VIDEO_FALLBACK = 'https://github.com/user-attachments/assets/936c42e9-4a5b-4fc3-8b03-3b8ef8cbb8db';
const DEMO_POSTER = '';

const HIGHLIGHT_CARDS = [
  {
    icon: ShieldCheck,
    accent: '#10b981',
    badge: 'SECURITY FIRST',
    headline: 'Zero-Trust Guardrails by Default',
    body: 'Automated PII masking, query sanitization, audit logging, and real-time regulatory compliance active out of the box.',
    featured: true,
  },
  {
    icon: Bot,
    accent: '#6366f1',
    badge: 'AGENTIC AI',
    headline: 'Autonomous Multi-Agent Workflows',
    body: 'Self-correcting AI agents orchestrate schema discovery, SQL synthesis, statistical modeling, and insight generation.',
  },
  {
    icon: Cpu,
    accent: '#ec4899',
    badge: 'ISOLATED SANDBOX',
    headline: 'Secure Python ML Runtime',
    body: 'Sandboxed analytics environment running pandas, scikit-learn, and matplotlib with total data boundary isolation.',
  },
];

const SECONDARY = [
  'Agentic Query Engine',
  'Natural-Language SQL',
  'Deterministic Guardrails',
  'Interactive Charts',
  'PDF Audit Logs',
  'Real-Time Web Search',
];

export default function SplashScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [videoErr, setVideoErr] = useState(false);

  const handleOpen = () => {
    setFadeOut(true);
    setTimeout(() => onComplete(), 500);
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    .lp-root {
      position: fixed; inset: 0; z-index: 100;
      background: #09090b;
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #f4f4f5;
      overflow-y: auto;
      transition: opacity 0.5s ease;
    }
    .lp-root.lp-out { opacity: 0; pointer-events: none; }

    /* Animated background glow */
    .lp-glow {
      position: fixed;
      top: 25%; left: 50%;
      transform: translate(-50%, -50%);
      width: 900px; height: 500px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.08) 50%, transparent 75%);
      filter: blur(100px);
      pointer-events: none;
      z-index: 0;
      animation: lp-pulse 8s ease-in-out infinite alternate;
    }

    .lp-wrap {
      position: relative; z-index: 1;
      max-width: 1120px; margin: 0 auto;
      padding: 0 24px 64px;
      box-sizing: border-box;
    }

    /* Nav */
    .lp-nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 28px 0 20px;
    }
    .lp-brand { display: flex; align-items: center; gap: 12px; }
    .lp-brand-mark {
      width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #6366f1 0%, #10b981 100%);
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.25);
    }
    .lp-brand-name {
      font-size: 22px; font-weight: 800; letter-spacing: -0.03em; color: #ffffff;
    }
    .lp-status-pill {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
      color: #10b981; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 6px 14px; border-radius: 99px;
    }
    .lp-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; }

    /* Hero */
    .lp-header {
      text-align: center;
      max-width: 800px;
      margin: 36px auto 44px;
    }

    .lp-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 16px; border-radius: 99px; margin-bottom: 22px;
      border: 1px solid rgba(16, 185, 129, 0.3);
      background: rgba(16, 185, 129, 0.08);
      font-size: 12px; font-weight: 600; color: #34d399; letter-spacing: 0.02em;
    }

    .lp-h1 {
      font-size: clamp(42px, 5.2vw, 68px);
      font-weight: 800; line-height: 1.05; letter-spacing: -0.03em; margin: 0 0 20px;
      color: #ffffff;
    }
    .lp-h1 .g-agent {
      background: linear-gradient(120deg, #818cf8 0%, #c084fc 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .lp-h1 .g-guard {
      background: linear-gradient(120deg, #34d399 0%, #10b981 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .lp-tagline {
      font-size: clamp(15px, 1.3vw, 18px); font-weight: 400; line-height: 1.6;
      color: #a1a1aa; max-width: 680px; margin: 0 auto 32px;
    }
    .lp-tagline strong { color: #f4f4f5; font-weight: 600; }

    .lp-cta-row { display: flex; align-items: center; justify-content: center; gap: 14px; }
    .lp-cta {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 15px 34px; border-radius: 99px; border: none; cursor: pointer;
      background: #ffffff; color: #09090b;
      font-size: 15px; font-weight: 700;
      box-shadow: 0 4px 24px rgba(255, 255, 255, 0.15);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .lp-cta:hover { transform: translateY(-2px); background: #f4f4f5; box-shadow: 0 8px 32px rgba(255, 255, 255, 0.25); }
    .lp-cta .arr { transition: transform 0.2s; }
    .lp-cta:hover .arr { transform: translateX(4px); }

    .lp-sec-pill {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12px; color: #71717a; margin-top: 14px; font-family: 'JetBrains Mono', monospace;
    }

    /* Video Section */
    .lp-hero-video-container {
      max-width: 980px;
      margin: 0 auto 52px;
    }
    .lp-video-frame {
      position: relative;
      border-radius: 16px;
      border: 1px solid #27272a;
      background: #121215;
      box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.05);
      overflow: hidden;
      transition: border-color 0.3s;
    }
    .lp-video-frame:hover { border-color: #3f3f46; }
    .lp-video-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 18px; background: #0c0c0e;
      border-bottom: 1px solid #27272a;
    }
    .lp-video-dots { display: flex; align-items: center; gap: 8px; }
    .lp-video-dots i { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .lp-video-dots .r { background: #ef4444; } .lp-video-dots .y { background: #f59e0b; } .lp-video-dots .gn { background: #10b981; }
    .lp-video-title {
      font-size: 11px; color: #71717a; font-weight: 500; font-family: 'JetBrains Mono', monospace;
      display: flex; align-items: center; gap: 6px;
    }
    .lp-video { display: block; width: 100%; aspect-ratio: 16 / 9; background: #000; object-fit: cover; }
    .lp-video-fallback {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
      width: 100%; aspect-ratio: 16 / 9; background: #09090b;
      text-align: center; padding: 24px;
    }
    .lp-video-fallback .pl {
      width: 56px; height: 56px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: #27272a; color: #fff;
    }
    .lp-video-fallback p { font-size: 13px; color: #a1a1aa; max-width: 320px; line-height: 1.5; }
    .lp-video-fallback code { color: #34d399; font-size: 12px; }

    /* Feature Cards */
    .lp-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 40px; }
    .lp-card {
      position: relative; border-radius: 14px; border: 1px solid #27272a;
      background: #121215; padding: 24px; text-align: left;
      transition: all 0.25s ease;
    }
    .lp-card:hover { background: #18181b; border-color: #3f3f46; transform: translateY(-3px); }
    .lp-card.featured {
      border-color: rgba(16, 185, 129, 0.4);
      background: linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, #121215 100%);
    }
    .lp-card.featured:hover { border-color: rgba(16, 185, 129, 0.7); }

    .lp-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .lp-card-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .lp-card-chip {
      font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
      padding: 4px 8px; border-radius: 6px; border: 1px solid;
    }
    .lp-card-headline { font-size: 17px; font-weight: 700; margin-bottom: 8px; color: #f4f4f5; letter-spacing: -0.01em; }
    .lp-card-body { font-size: 13px; color: #8a8a93; line-height: 1.6; }

    /* Secondary Pills */
    .lp-secondary { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
    .lp-pill {
      font-size: 12px; font-weight: 500; color: #a1a1aa;
      padding: 7px 16px; border-radius: 99px; border: 1px solid #27272a;
      background: #121215; transition: all 0.2s;
    }
    .lp-pill:hover { color: #f4f4f5; border-color: #3f3f46; background: #18181b; }

    /* Animations */
    .a-up { animation: lp-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
    @keyframes lp-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes lp-pulse { 0% { opacity: 0.6; } 100% { opacity: 1; } }

    @media (max-width: 900px) {
      .lp-cards { grid-template-columns: 1fr; }
      .lp-header { margin-top: 20px; }
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div className={`lp-root${fadeOut ? ' lp-out' : ''}`}>
        <div className="lp-glow" />

        <div className="lp-wrap">
          {/* Top Navigation */}
          <nav className="lp-nav a-up">
            <div className="lp-brand">
              <div className="lp-brand-mark"><BarChart3 size={20} color="#fff" /></div>
              <span className="lp-brand-name">DataTalk</span>
            </div>
            <div className="lp-status-pill">
              <span className="lp-status-dot" /> Enterprise Guardrails Active
            </div>
          </nav>

          {/* Hero Section */}
          <div className="lp-header a-up" style={{ animationDelay: '0.06s' }}>
            <div className="lp-badge">
              <ShieldCheck size={14} /> Zero-Trust AI & Security Guardrails
            </div>
            <h1 className="lp-h1">
              Talk to your Data with <span className="g-agent">Agentic AI.</span>
            </h1>
            <p className="lp-tagline">
              Autonomous AI agents run complex SQL, statistical modeling, and ML workflows — 
              backed by <strong>default enterprise guardrails and zero-trust security</strong>.
            </p>
            <div className="lp-cta-row">
              <button className="lp-cta" onClick={handleOpen}>
                Launch Platform <ArrowRight size={16} className="arr" />
              </button>
            </div>
            <div className="lp-sec-pill">
              <Lock size={12} /> Air-Gapped Python Sandbox · Row-Level Security
            </div>
          </div>

          {/* Center Showcase: Demo Video */}
          <div className="lp-hero-video-container a-up" style={{ animationDelay: '0.12s' }}>
            <div className="lp-video-frame" id="demo">
              <div className="lp-video-bar">
                <div className="lp-video-dots">
                  <i className="r" /><i className="y" /><i className="gn" />
                </div>
                <div className="lp-video-title">
                  <Activity size={12} color="#10b981" /> agentic_workflow_execution.mp4
                </div>
                <div style={{ width: 40 }} />
              </div>
              {videoErr ? (
                <div className="lp-video-fallback">
                  <div className="pl"><Play size={22} /></div>
                  <p>
                    Demo recording file missing. Place video at{' '}
                    <code>frontend/public/demo.mp4</code>
                  </p>
                </div>
              ) : (
                <video
                  className="lp-video"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={DEMO_POSTER || undefined}
                  onError={(e) => {
                    if (e.currentTarget.src.indexOf(DEMO_VIDEO_FALLBACK) === -1) {
                      e.currentTarget.src = DEMO_VIDEO_FALLBACK;
                    } else {
                      setVideoErr(true);
                    }
                  }}
                >
                  <source src={DEMO_VIDEO_SRC} type="video/mp4" />
                </video>
              )}
            </div>
          </div>

          {/* Core Feature Highlights */}
          <div className="lp-cards a-up" style={{ animationDelay: '0.18s' }}>
            {HIGHLIGHT_CARDS.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.badge} className={`lp-card${c.featured ? ' featured' : ''}`}>
                  <div className="lp-card-top">
                    <div className="lp-card-icon" style={{ background: `${c.accent}15`, border: `1px solid ${c.accent}30` }}>
                      <Icon size={18} style={{ color: c.accent }} />
                    </div>
                    <span className="lp-card-chip" style={{ color: c.accent, borderColor: `${c.accent}35`, background: `${c.accent}10` }}>
                      {c.badge}
                    </span>
                  </div>
                  <div className="lp-card-headline">{c.headline}</div>
                  <div className="lp-card-body">{c.body}</div>
                </div>
              );
            })}
          </div>

          {/* Secondary Capabilities */}
          <div className="lp-secondary a-up" style={{ animationDelay: '0.24s' }}>
            {SECONDARY.map((s) => <span key={s} className="lp-pill">{s}</span>)}
          </div>
        </div>
      </div>
    </>
  );
}

import React, { useState } from 'react';
import { ArrowRight, Shield, FlaskConical, CheckCircle2, Play, BarChart3 } from 'lucide-react';

// ── Demo video source ────────────────────────────────────────────────
// Drop your recording at frontend/public/demo.mp4 to serve it locally,
// or point this at any hosted MP4. Defaults to the project's GitHub asset.
const DEMO_VIDEO_SRC = '/demo.mp4';
const DEMO_VIDEO_FALLBACK = 'https://github.com/user-attachments/assets/936c42e9-4a5b-4fc3-8b03-3b8ef8cbb8db';
const DEMO_POSTER = ''; // optional: '/demo-poster.png'

const HIGHLIGHT_CARDS = [
  {
    icon: Shield,
    accent: '#22c55e',
    label: 'Security First',
    headline: 'Zero-trust by default',
    body: 'End-to-end data masking, sensitive-column detection, audit trails, and real-time compliance guardrails on every query.',
  },
  {
    icon: FlaskConical,
    accent: '#a855f7',
    label: 'Python ML Engine',
    headline: 'Full analytics power',
    body: 'Sandboxed Python with pandas, scikit-learn & matplotlib. Run regressions, clustering and forecasts — no code needed.',
  },
  {
    icon: CheckCircle2,
    accent: '#da1e79',
    label: 'Compliance Ready',
    headline: 'Regulatory out of the box',
    body: 'PMLA / AML, KYC / CDD, DPDP Act 2023 and IRAC norms — every response validated against live compliance rules.',
  },
];

const SECONDARY = ['Natural-Language SQL', 'Interactive Charts', 'PDF Audit Reports', 'Web Search', 'Schema Explorer'];

export default function SplashScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [videoErr, setVideoErr] = useState(false);

  const handleOpen = () => {
    setFadeOut(true);
    setTimeout(() => onComplete(), 500);
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

    .lp-root {
      position: fixed; inset: 0; z-index: 100;
      background: radial-gradient(circle at 20% 0%, #4a1568 0%, transparent 55%),
                  radial-gradient(circle at 90% 90%, #2a0a44 0%, transparent 50%),
                  linear-gradient(160deg, #1a0530 0%, #0d0418 100%);
      font-family: 'Inter', sans-serif;
      color: #fff;
      overflow-y: auto;
      transition: opacity 0.5s ease;
    }
    .lp-root.lp-out { opacity: 0; pointer-events: none; }

    .lp-blob { position: fixed; border-radius: 50%; filter: blur(150px); pointer-events: none; z-index: 0; }
    .lp-blob-1 { width: 760px; height: 760px; background: radial-gradient(circle, rgba(218,30,121,0.16) 0%, transparent 65%); top: -280px; left: -180px; }
    .lp-blob-2 { width: 620px; height: 620px; background: radial-gradient(circle, rgba(124,58,237,0.20) 0%, transparent 65%); bottom: -220px; right: -120px; }

    .lp-wrap {
      position: relative; z-index: 1;
      max-width: 1200px; margin: 0 auto;
      padding: 0 32px 64px;
      box-sizing: border-box;
    }

    /* ── Nav ── */
    .lp-nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 24px 0 0;
    }
    .lp-brand { display: flex; align-items: center; gap: 10px; }
    .lp-brand-mark {
      width: 34px; height: 34px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #da1e79, #7c3aed);
      box-shadow: 0 6px 20px rgba(218,30,121,0.35);
    }
    .lp-brand-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 18px; font-weight: 700; letter-spacing: -0.02em;
    }
    .lp-team {
      font-size: 10.5px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
      color: rgba(255,255,255,0.35);
      border: 1px solid rgba(255,255,255,0.12);
      padding: 7px 14px; border-radius: 99px;
    }

    /* ── Hero grid ── */
    .lp-hero {
      display: grid;
      grid-template-columns: 1fr 1.05fr;
      gap: 56px;
      align-items: center;
      padding: 64px 0 56px;
    }
    .lp-hero-copy { text-align: left; }

    .lp-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 14px; border-radius: 99px; margin-bottom: 24px;
      border: 1px solid rgba(218,30,121,0.4);
      background: rgba(218,30,121,0.1);
      font-size: 12px; font-weight: 600; color: #f9a8d4; letter-spacing: 0.02em;
    }
    .lp-dot { width: 6px; height: 6px; border-radius: 50%; background: #da1e79; animation: lp-blink 2s ease-in-out infinite; }
    @keyframes lp-blink { 0%,100%{opacity:1} 50%{opacity:0.25} }

    .lp-h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(48px, 5.6vw, 76px);
      font-weight: 700; line-height: 1.02; letter-spacing: -0.04em; margin: 0 0 22px;
    }
    .lp-h1 .g {
      background: linear-gradient(120deg, #da1e79 0%, #a855f7 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .lp-tagline {
      font-size: clamp(15px, 1.5vw, 18px); font-weight: 400; line-height: 1.65;
      color: rgba(255,255,255,0.5); max-width: 520px; margin: 0 0 34px;
    }
    .lp-tagline strong { color: rgba(255,255,255,0.85); font-weight: 600; }

    .lp-cta-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .lp-cta {
      position: relative; overflow: hidden;
      display: inline-flex; align-items: center; gap: 10px;
      padding: 15px 34px; border-radius: 9999px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #da1e79, #7c3aed);
      color: #fff; font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700;
      letter-spacing: -0.01em;
      box-shadow: 0 10px 32px rgba(124,58,237,0.4);
      transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s;
    }
    .lp-cta:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 18px 48px rgba(124,58,237,0.55); }
    .lp-cta .arr { transition: transform 0.2s; }
    .lp-cta:hover .arr { transform: translateX(4px); }
    .lp-cta-ghost {
      display: inline-flex; align-items: center; gap: 9px;
      padding: 14px 26px; border-radius: 9999px; cursor: pointer;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14);
      color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 600; font-family: 'Inter', sans-serif;
      transition: background 0.2s, border-color 0.2s;
      text-decoration: none;
    }
    .lp-cta-ghost:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.25); }
    .lp-footnote { margin-top: 16px; font-size: 11.5px; color: rgba(255,255,255,0.3); letter-spacing: 0.02em; }

    /* ── Video frame ── */
    .lp-video-frame {
      position: relative;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.04);
      box-shadow: 0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(218,30,121,0.12);
      overflow: hidden;
    }
    .lp-video-frame::before {
      content: ''; position: absolute; inset: -2px; z-index: -1; border-radius: 20px;
      background: linear-gradient(135deg, rgba(218,30,121,0.35), rgba(124,58,237,0.35));
      filter: blur(22px); opacity: 0.6;
    }
    .lp-video-bar {
      display: flex; align-items: center; gap: 7px;
      padding: 11px 14px; background: rgba(13,4,24,0.85);
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .lp-video-bar i { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
    .lp-video-bar .r { background: #ff5f57; } .lp-video-bar .y { background: #febc2e; } .lp-video-bar .gn { background: #28c840; }
    .lp-video-bar span {
      margin-left: 8px; font-size: 11.5px; color: rgba(255,255,255,0.4); font-weight: 500;
    }
    .lp-video { display: block; width: 100%; aspect-ratio: 16 / 10; background: #0d0418; object-fit: cover; }
    .lp-video-fallback {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
      width: 100%; aspect-ratio: 16 / 10; background: linear-gradient(160deg, #2a0a44, #0d0418);
      text-align: center; padding: 24px;
    }
    .lp-video-fallback .pl {
      width: 58px; height: 58px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #da1e79, #7c3aed);
      box-shadow: 0 8px 28px rgba(124,58,237,0.5);
    }
    .lp-video-fallback p { font-size: 13px; color: rgba(255,255,255,0.55); max-width: 320px; line-height: 1.55; }
    .lp-video-fallback code { color: #f9a8d4; font-size: 12px; }

    /* ── Feature cards ── */
    .lp-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px; }
    .lp-card {
      border-radius: 16px; border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04); padding: 22px; text-align: left;
      transition: border-color 0.25s, background 0.25s, transform 0.25s;
    }
    .lp-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.16); transform: translateY(-3px); }
    .lp-card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .lp-card-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .lp-card-chip {
      font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
      padding: 3px 9px; border-radius: 99px; border: 1px solid;
    }
    .lp-card-headline { font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 700; margin-bottom: 8px; letter-spacing: -0.02em; }
    .lp-card-body { font-size: 12.5px; color: rgba(255,255,255,0.48); line-height: 1.6; }

    /* ── Secondary pills ── */
    .lp-secondary { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
    .lp-pill {
      font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.42);
      padding: 6px 15px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.1);
      transition: color 0.2s, border-color 0.2s;
    }
    .lp-pill:hover { color: rgba(255,255,255,0.8); border-color: rgba(255,255,255,0.24); }

    /* ── Animations ── */
    .a { animation: lp-up 0.6s ease-out both; }
    @keyframes lp-up { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 920px) {
      .lp-hero { grid-template-columns: 1fr; gap: 40px; padding: 40px 0; }
      .lp-hero-copy { text-align: center; }
      .lp-tagline { margin-left: auto; margin-right: auto; }
      .lp-cta-row { justify-content: center; }
      .lp-cards { grid-template-columns: 1fr; }
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div className={`lp-root${fadeOut ? ' lp-out' : ''}`}>
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />

        <div className="lp-wrap">
          {/* Nav */}
          <nav className="lp-nav a">
            <div className="lp-brand">
              <div className="lp-brand-mark"><BarChart3 size={18} color="#fff" /></div>
              <span className="lp-brand-name">DataTalk</span>
            </div>
            <span className="lp-team">Team · Swords of Summer</span>
          </nav>

          {/* Hero */}
          <div className="lp-hero">
            <div className="lp-hero-copy a" style={{ animationDelay: '0.06s' }}>
              <div className="lp-badge">
                <span className="lp-dot" />
                NatWest · Code for Purpose 2026
              </div>
              <h1 className="lp-h1">Talk to your <span className="g">Data.</span></h1>
              <p className="lp-tagline">
                Run complex analytics, ML models &amp; compliance checks —{' '}
                <strong>without writing a single line of code.</strong> Powered by a full
                Python environment, live web search, and AI.
              </p>
              <div className="lp-cta-row">
                <button className="lp-cta" onClick={handleOpen}>
                  Launch app <ArrowRight size={16} className="arr" />
                </button>
                <a className="lp-cta-ghost" href="#demo">
                  <Play size={15} /> Watch demo
                </a>
              </div>
              <div className="lp-footnote">No setup required · No account needed</div>
            </div>

            {/* Inline demo video */}
            <div className="lp-video-frame a" id="demo" style={{ animationDelay: '0.16s' }}>
              <div className="lp-video-bar">
                <i className="r" /><i className="y" /><i className="gn" />
                <span>DataTalk — live demo</span>
              </div>
              {videoErr ? (
                <div className="lp-video-fallback">
                  <div className="pl"><Play size={24} color="#fff" /></div>
                  <p>
                    Demo video not found. Drop your recording at{' '}
                    <code>frontend/public/demo.mp4</code> to play it here.
                  </p>
                </div>
              ) : (
                <video
                  className="lp-video"
                  controls
                  playsInline
                  preload="metadata"
                  poster={DEMO_POSTER || undefined}
                  onError={(e) => {
                    // Try the hosted fallback once, then show placeholder.
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

          {/* Feature cards */}
          <div className="lp-cards a" style={{ animationDelay: '0.24s' }}>
            {HIGHLIGHT_CARDS.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="lp-card">
                  <div className="lp-card-top">
                    <div className="lp-card-icon" style={{ background: `${c.accent}1f`, border: `1px solid ${c.accent}38` }}>
                      <Icon size={16} style={{ color: c.accent }} />
                    </div>
                    <span className="lp-card-chip" style={{ color: c.accent, borderColor: `${c.accent}45`, background: `${c.accent}12` }}>
                      {c.label}
                    </span>
                  </div>
                  <div className="lp-card-headline">{c.headline}</div>
                  <div className="lp-card-body">{c.body}</div>
                </div>
              );
            })}
          </div>

          {/* Secondary pills */}
          <div className="lp-secondary a" style={{ animationDelay: '0.32s' }}>
            {SECONDARY.map((s) => <span key={s} className="lp-pill">{s}</span>)}
          </div>
        </div>
      </div>
    </>
  );
}

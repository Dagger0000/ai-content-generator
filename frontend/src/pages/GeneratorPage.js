import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const CONTENT_TYPES = [
  { id: 'blog', label: 'Blog Post', icon: '📝' },
  { id: 'ad-copy', label: 'Ad Copy', icon: '📢' },
  { id: 'caption', label: 'Caption', icon: '✨' },
  { id: 'email', label: 'Email', icon: '📧' },
];

const TONES = ['professional', 'casual', 'persuasive', 'friendly', 'luxury', 'humorous'];

const INDUSTRIES = [
  'Technology', 'Fashion', 'Food & Beverage', 'Finance', 'Health & Wellness',
  'Education', 'Travel', 'Marketing', 'E-commerce', 'Real Estate',
  'Entertainment', 'Automotive', 'Sports', 'Beauty', 'General'
];

const SEO_COLOR = (score) => {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
};

export default function GeneratorPage() {
  const [contentType, setContentType] = useState('blog');
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('professional');
  const [industry, setIndustry] = useState('Technology');
  const [keywords, setKeywords] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [seoScore, setSeoScore] = useState(null);
  const [trendsUsed, setTrendsUsed] = useState(false);
  const [trendsContext, setTrendsContext] = useState('');
  const [rewriting, setRewriting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [variations, setVariations] = useState([]);
  const [showVariations, setShowVariations] = useState(false);
  const [loadingVariations, setLoadingVariations] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [activeVariation, setActiveVariation] = useState(null);

  const generate = async () => {
    if (!prompt.trim()) return toast.error('Please enter a prompt');
    setLoading(true);
    setOutput('');
    setSeoScore(null);
    setTrendsUsed(false);
    setVariations([]);
    setShowVariations(false);
    try {
      const { data } = await api.post('/content/generate', {
        contentType, prompt, tone, industry, keywords
      });
      setOutput(data.content);
      setSeoScore(data.seoScore);
      setTrendsUsed(data.trendsUsed);
      setTrendsContext(data.trendsContext || '');
      toast.success('Content generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const rewrite = async (action) => {
    if (!output) return toast.error('No content to rewrite');
    setRewriting(true);
    try {
      const { data } = await api.post('/content/rewrite', { content: output, action, tone });
      setOutput(data.content);
      toast.success(`Content ${action}ed!`);
    } catch (err) {
      toast.error('Rewrite failed');
    } finally {
      setRewriting(false);
    }
  };

  const generateVariations = async () => {
    if (!prompt.trim()) return toast.error('Please enter a prompt first');
    setLoadingVariations(true);
    setShowVariations(true);
    setVariations([]);
    try {
      const { data } = await api.post('/content/variations', {
        prompt, contentType, tone, industry, count: 3
      });
      setVariations(data.variations);
    } catch (err) {
      toast.error('Variations generation failed');
      setShowVariations(false);
    } finally {
      setLoadingVariations(false);
    }
  };

  const saveProject = async () => {
    console.log('scheduledDate:', scheduledDate); // ADD THIS
    if (!output) return toast.error('No content to save');
    if (!saveTitle.trim()) return toast.error('Enter a project title');
    setSaving(true);
    try {
      await api.post('/projects', {
        title: saveTitle,
        content: output,
        contentType,
        tone,
        industry,
        keywords,
        seoScore,
        scheduledDate: scheduledDate || null
      });
      toast.success('Project saved!');
      setShowSaveModal(false);
      setSaveTitle('');
    } catch (err) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text || output);
    toast.success('Copied to clipboard!');
  };

  return (
    <div>
      <div className="page-title">Generate Content</div>
      <p className="page-subtitle">AI-powered, trend-aware content for every channel</p>

      <div className="generator-layout">
        {/* LEFT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Content Type */}
          <div className="card">
            <div className="form-label" style={{ marginBottom: 10 }}>Content Type</div>
            <div className="content-type-grid">
              {CONTENT_TYPES.map(ct => (
                <button
                  key={ct.id}
                  className={`content-type-btn${contentType === ct.id ? ' active' : ''}`}
                  onClick={() => setContentType(ct.id)}
                >
                  <span className="icon">{ct.icon}</span>
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="card">
            <div className="form-group">
              <label className="form-label">Your Prompt</label>
              <textarea
                className="form-textarea"
                placeholder="e.g. Write about the benefits of AI in e-commerce for small businesses..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          {/* Tone */}
          <div className="card">
            <div className="form-label" style={{ marginBottom: 10 }}>Tone</div>
            <div className="tone-grid">
              {TONES.map(t => (
                <button
                  key={t}
                  className={`tone-btn${tone === t ? ' active' : ''}`}
                  onClick={() => setTone(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Industry, Keywords, Schedule */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Industry / Niche</label>
              <select
                className="form-select"
                value={industry}
                onChange={e => setIndustry(e.target.value)}
              >
                {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Keywords (comma-separated)</label>
              <input
                className="form-input"
                placeholder="e.g. AI, automation, productivity"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Schedule Generation (optional)</label>
              <input
                className="form-input"
                type="datetime-local"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={generate}
            disabled={loading}
            style={{ padding: '14px', fontSize: '15px' }}
          >
            {loading ? (
              <><span className="generating-dots"><span>.</span><span>.</span><span>.</span></span> Generating...</>
            ) : '✦ Generate Content'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={generateVariations}
            disabled={!prompt.trim() || loadingVariations}
          >
            {loadingVariations ? 'Generating...' : '🔀 Generate 3 Variations'}
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="output-card card">

            {/* Toolbar */}
            <div className="output-toolbar">
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, flex: 1 }}>Output</span>
              {trendsUsed && (
                <span className="trends-badge">📈 Trends Applied</span>
              )}
              {seoScore !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>SEO</span>
                  <div style={{ width: 80, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${seoScore}%`,
                      background: SEO_COLOR(seoScore),
                      borderRadius: 3,
                      transition: 'width 0.8s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: SEO_COLOR(seoScore) }}>{seoScore}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {output && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard()}>📋 Copy</button>
                <button className="btn btn-secondary btn-sm" onClick={() => rewrite('rewrite')} disabled={rewriting}>✏️ Rewrite</button>
                <button className="btn btn-secondary btn-sm" onClick={() => rewrite('expand')} disabled={rewriting}>📖 Expand</button>
                <button className="btn btn-secondary btn-sm" onClick={() => rewrite('shorten')} disabled={rewriting}>✂️ Shorten</button>
                <button className="btn btn-secondary btn-sm" onClick={() => rewrite('seo')} disabled={rewriting}>🔍 SEO Optimize</button>
                <button className="btn btn-primary btn-sm" onClick={() => setShowSaveModal(true)}>💾 Save Project</button>
              </div>
            )}

            {/* Trends context info */}
            {trendsContext && (
              <div style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 10, padding: '10px 14px',
                fontSize: 12, color: '#6ee7b7'
              }}>
                📈 <strong>Trends used:</strong> {trendsContext}
              </div>
            )}

            {/* Output area */}
            {output ? (
              <textarea
                className="output-textarea"
                value={rewriting ? output + '\n\n(Rewriting...)' : output}
                onChange={e => setOutput(e.target.value)}
                readOnly={rewriting}
              />
            ) : (
              <div className="output-placeholder">
                <div className="big-icon">{loading ? '⚡' : '✦'}</div>
                {loading ? (
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 6 }}>Generating your content...</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Fetching trends • Crafting copy • Optimizing for SEO
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 6 }}>Your content will appear here</div>
                    <div style={{ fontSize: 12 }}>Configure your settings and click Generate</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Variations Panel */}
          {showVariations && (
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 16 }}>
                🔀 Variations
              </div>
              {loadingVariations ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <div className="generating-dots"><span>.</span><span>.</span><span>.</span></div>
                  <div style={{ marginTop: 8, fontSize: 13 }}>Generating variations...</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {variations.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        background: activeVariation === i ? 'rgba(139,92,246,0.08)' : 'var(--bg3)',
                        border: `1px solid ${activeVariation === i ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`,
                        borderRadius: 10, padding: 14, cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => setActiveVariation(activeVariation === i ? null : i)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                          Variation {i + 1}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={e => { e.stopPropagation(); copyToClipboard(v); }}
                          >
                            📋
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={e => { e.stopPropagation(); setOutput(v); toast.success('Variation loaded!'); }}
                          >
                            Use This
                          </button>
                        </div>
                      </div>
                      <div style={{
                        fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
                        maxHeight: activeVariation === i ? 'none' : '60px',
                        overflow: 'hidden'
                      }}>
                        {v}
                      </div>
                      {activeVariation !== i && (
                        <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6 }}>Click to expand</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 24
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 440 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              Save Project
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Project Title</label>
              <input
                className="form-input"
                placeholder="e.g. Q2 Campaign Blog Post"
                value={saveTitle}
                onChange={e => setSaveTitle(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && saveProject()}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveProject} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

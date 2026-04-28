import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const INDUSTRIES = [
  'Technology', 'Fashion', 'Food & Beverage', 'Finance', 'Health & Wellness',
  'Education', 'Travel', 'Marketing', 'E-commerce', 'General'
];

const GEO_OPTIONS = [
  { code: 'US', label: '🇺🇸 United States' },
  { code: 'GB', label: '🇬🇧 United Kingdom' },
  { code: 'IN', label: '🇮🇳 India' },
  { code: 'CA', label: '🇨🇦 Canada' },
  { code: 'AU', label: '🇦🇺 Australia' },
  { code: 'DE', label: '🇩🇪 Germany' },
  { code: '', label: '🌍 Worldwide' },
];

const BAR_COLORS = [
  '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95',
  '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63'
];

export default function TrendsPage() {
  const [niche, setNiche] = useState('Technology');
  const [geo, setGeo] = useState('US');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/trends?niche=${encodeURIComponent(niche)}&geo=${geo}`);
      setData(res.data);
      setLastFetched(new Date());
      if (res.data.mock) {
        toast('Showing demo trends data — connect Trends service for live data', { icon: 'ℹ️' });
      } else {
        toast.success('Live trends loaded!');
      }
    } catch (err) {
      toast.error('Failed to fetch trends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrends(); }, []); // eslint-disable-line

  const maxScore = data?.trending_scores?.length
    ? Math.max(...data.trending_scores.map(t => t.score), 1)
    : 100;

  return (
    <div>
      <div className="page-title">Trends Dashboard</div>
      <p className="page-subtitle">Real-time Google Trends data by industry and region</p>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="form-label">Industry / Niche</label>
            <select className="form-select" value={niche} onChange={e => setNiche(e.target.value)}>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="form-label">Region</label>
            <select className="form-select" value={geo} onChange={e => setGeo(e.target.value)}>
              {GEO_OPTIONS.map(g => <option key={g.code} value={g.code}>{g.label}</option>)}
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={fetchTrends}
            disabled={loading}
            style={{ paddingLeft: 24, paddingRight: 24 }}
          >
            {loading ? (
              <><span className="generating-dots"><span>.</span><span>.</span><span>.</span></span> Loading...</>
            ) : '📊 Fetch Trends'}
          </button>
        </div>
        {lastFetched && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            Last updated: {lastFetched.toLocaleTimeString()}
            {data?.mock && <span style={{ color: 'var(--accent3)', marginLeft: 8 }}>● Demo Data</span>}
            {!data?.mock && <span style={{ color: 'var(--success)', marginLeft: 8 }}>● Live Data</span>}
          </div>
        )}
      </div>

      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div className="loader-pulse" style={{ margin: '0 auto 16px' }} />
          Fetching live trends...
        </div>
      ) : data ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Trending Keywords */}
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
              🔥 Trending Keywords
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                in {niche}
              </span>
            </div>
            {data.trending_scores?.length > 0 ? (
              <div>
                {data.trending_scores.slice(0, 10).map((item, i) => (
                  <div key={i} className="trend-item">
                    <div className="trend-rank">{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div className="trend-keyword">{item.keyword}</div>
                      <div style={{ marginTop: 6, height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                        <div
                          className="trend-score-bar"
                          style={{
                            width: `${(item.score / maxScore) * 100}%`,
                            background: BAR_COLORS[i % BAR_COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 600, minWidth: 36, textAlign: 'right',
                      color: BAR_COLORS[i % BAR_COLORS.length]
                    }}>
                      {Math.round(item.score)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No trending data available</div>
            )}
          </div>

          {/* Rising Queries */}
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
              🚀 Rising Queries
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                Breakout searches
              </span>
            </div>
            {data.rising_queries?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.rising_queries.slice(0, 10).map((q, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 10,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    transition: 'all 0.2s'
                  }}>
                    <span style={{ fontSize: 16 }}>
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`}
                    </span>
                    <span style={{ fontSize: 14, flex: 1 }}>{q}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 8px',
                      borderRadius: 20, background: 'rgba(6,182,212,0.1)',
                      color: 'var(--accent2)', border: '1px solid rgba(6,182,212,0.2)'
                    }}>
                      RISING
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No rising queries data available</div>
            )}
          </div>

          {/* Geo Data */}
          {data.geo_data?.length > 0 && (
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
                🌍 Interest by Region
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.geo_data.slice(0, 8).map((g, i) => {
                  const maxInterest = Math.max(...data.geo_data.map(x => x.interest), 1);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 100, fontSize: 13, color: 'var(--text-dim)' }}>{g.region}</div>
                      <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(g.interest / maxInterest) * 100}%`,
                          background: `linear-gradient(90deg, var(--accent), var(--accent2))`,
                          borderRadius: 3
                        }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', width: 30, textAlign: 'right' }}>
                        {g.interest}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trend Summary / Score Card */}
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.05))' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
              📈 Trend Score
            </div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                fontSize: 72, fontFamily: 'var(--font-display)', fontWeight: 800,
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', lineHeight: 1
              }}>
                {data.trending_scores?.length > 0
                  ? Math.round(data.trending_scores.slice(0, 5).reduce((a, t) => a + t.score, 0) / 5)
                  : '--'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
                Avg. Interest Score (0–100)
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Top Keywords This Week</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {data.trending_keywords?.slice(0, 8).map((kw, i) => (
                  <span key={i} className="badge badge-purple">{kw}</span>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Rising Highlights</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {data.rising_queries?.slice(0, 5).map((q, i) => (
                  <span key={i} className="badge badge-cyan">{q}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

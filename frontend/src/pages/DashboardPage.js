import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import api from '../lib/api';

const TYPE_ICONS = { blog: '📝', 'ad-copy': '📢', caption: '✨', email: '📧' };
const SEO_COLOR = (s) => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const openProject = (p) => {
    setSelected(p);
    setEditContent(p.content);
    setEditTitle(p.title);
  };

  const saveEdits = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/projects/${selected.id}`, {
        title: editTitle,
        content: editContent
      });
      setProjects(ps => ps.map(p => p.id === data.id ? data : p));
      setSelected(data);
      toast.success('Saved!');
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(ps => ps.filter(p => p.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const copyContent = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied!');
  };

  const filtered = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || p.content_type === filterType;
    return matchSearch && matchType;
  });

  const stats = {
    total: projects.length,
    blogs: projects.filter(p => p.content_type === 'blog').length,
    avgSeo: projects.length
      ? Math.round(projects.reduce((a, p) => a + (p.seo_score || 0), 0) / projects.length)
      : 0,
    thisWeek: projects.filter(p => {
      const d = new Date(p.created_at);
      return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div className="page-title">My Projects</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          + New Content
        </button>
      </div>
      <p className="page-subtitle">Manage and edit your saved content</p>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{stats.thisWeek}</div>
          <div className="stat-label">This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent2)' }}>{stats.blogs}</div>
          <div className="stat-label">Blog Posts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: SEO_COLOR(stats.avgSeo) }}>{stats.avgSeo}</div>
          <div className="stat-label">Avg SEO Score</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="form-input"
          placeholder="🔍 Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: 160 }}>
          <option value="all">All Types</option>
          <option value="blog">Blog Posts</option>
          <option value="ad-copy">Ad Copy</option>
          <option value="caption">Captions</option>
          <option value="email">Emails</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div className="loader-pulse" style={{ margin: '0 auto 16px' }} />
          Loading projects...
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📂</div>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>
            {projects.length === 0 ? 'No projects yet' : 'No results found'}
          </div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>
            {projects.length === 0
              ? 'Generate your first piece of content to get started'
              : 'Try a different search or filter'}
          </div>
          {projects.length === 0 && (
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              ✦ Generate Content
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {/* Project cards */}
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, alignContent: 'start' }}>
            {filtered.map(p => (
              <div
                key={p.id}
                className="project-card"
                style={{
                  borderColor: selected?.id === p.id ? 'rgba(139,92,246,0.5)' : undefined,
                  background: selected?.id === p.id ? 'rgba(139,92,246,0.05)' : undefined
                }}
                onClick={() => openProject(p)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{TYPE_ICONS[p.content_type] || '📄'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="project-card-title" style={{
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {p.title}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="badge badge-purple">{p.content_type}</span>
                      {p.tone && <span className="badge badge-cyan">{p.tone}</span>}
                      {p.seo_score > 0 && (
                        <span className="badge" style={{
                          background: `${SEO_COLOR(p.seo_score)}18`,
                          color: SEO_COLOR(p.seo_score),
                          border: `1px solid ${SEO_COLOR(p.seo_score)}40`
                        }}>
                          SEO {p.seo_score}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="project-card-preview">{p.content}</div>
                <div className="project-card-footer">
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {p.scheduled_date && (
  <span style={{ marginRight: 8, color: 'var(--accent-cyan)' }}>
    📅 Scheduled: {new Date(p.scheduled_date).toLocaleDateString()}
  </span>
)}
{p.created_at ? formatDistanceToNow(new Date(p.created_at), { addSuffix: true }) : ''}
                  </span>
                  <div className="project-card-actions" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-secondary btn-sm" onClick={() => copyContent(p.content)}>📋</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteProject(p.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Edit panel */}
          {selected && (
            <div className="card" style={{ position: 'sticky', top: 20, alignSelf: 'start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <input
                  className="form-input"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}
                />
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span className="badge badge-purple">{selected.content_type}</span>
                {selected.tone && <span className="badge badge-cyan">{selected.tone}</span>}
                {selected.industry && <span className="badge badge-amber">{selected.industry}</span>}
              </div>
              <textarea
                className="output-textarea"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                style={{ minHeight: 400 }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => copyContent(editContent)}>📋 Copy</button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteProject(selected.id)}>🗑️ Delete</button>
                <button className="btn btn-primary btn-sm" onClick={saveEdits} disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

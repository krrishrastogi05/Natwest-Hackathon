import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Sparkles, Layers, AlertCircle } from 'lucide-react';

export default function SemanticLayerEditor({ isOpen, onClose, semanticLayer, onSave, sessionId }) {
  const [metrics, setMetrics] = useState(semanticLayer || []);
  const [newMetric, setNewMetric] = useState({ name: '', expression: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const suggestedMetrics = [
    { name: 'Total Revenue', expression: 'SUM(revenue)', description: 'Sum of all revenue values' },
    { name: 'Average Order Value', expression: 'AVG(order_amount)', description: 'Mean order amount' },
    { name: 'Customer Count', expression: 'COUNT(DISTINCT customer_id)', description: 'Unique customer count' },
    { name: 'Conversion Rate', expression: 'COUNT(purchases) / COUNT(visits) * 100', description: 'Purchase to visit ratio' },
  ];

  const handleAddMetric = () => {
    if (!newMetric.name.trim() || !newMetric.expression.trim()) return;
    setMetrics(prev => [...prev, { ...newMetric, id: Date.now() }]);
    setNewMetric({ name: '', expression: '', description: '' });
    setShowAddForm(false);
  };

  const handleQuickAdd = (metric) => {
    if (metrics.some(m => m.name === metric.name)) return;
    setMetrics(prev => [...prev, { ...metric, id: Date.now() }]);
  };

  const handleDelete = (id) => {
    setMetrics(prev => prev.filter(m => m.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (onSave) await onSave(metrics);
      onClose();
    } catch (err) {
      setError('Failed to save semantic layer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-up">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] glass-strong rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/15 border border-[#8b5cf6]/20 flex items-center justify-center">
              <Layers size={16} className="text-[#8b5cf6]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Semantic Layer</h2>
              <p className="text-[11px] text-[#94a3b8]">Define business metrics and expressions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#ef4444]/8 border border-[#ef4444]/20">
              <AlertCircle size={14} className="text-[#ef4444]" />
              <span className="text-xs text-[#ef4444]">{error}</span>
            </div>
          )}

          {/* Quick Add Suggestions */}
          <div>
            <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-2">Quick Add Suggested Metrics</p>
            <div className="flex flex-wrap gap-2">
              {suggestedMetrics.map((sm, i) => {
                const alreadyAdded = metrics.some(m => m.name === sm.name);
                return (
                  <button
                    key={i}
                    onClick={() => handleQuickAdd(sm)}
                    disabled={alreadyAdded}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                      alreadyAdded
                        ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 cursor-default'
                        : 'bg-[#8b5cf6]/8 text-[#a78bfa] border border-[#8b5cf6]/15 hover:bg-[#8b5cf6]/15 hover:border-[#8b5cf6]/30'
                    }`}
                  >
                    <Sparkles size={10} />
                    {sm.name}
                    {alreadyAdded && ' ✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Existing Metrics List */}
          <div>
            <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-2">
              Defined Metrics ({metrics.length})
            </p>
            {metrics.length === 0 ? (
              <div className="text-center py-6 text-[#4a4a6a] text-xs">
                No metrics defined yet. Add one below or use quick add.
              </div>
            ) : (
              <div className="space-y-2">
                {metrics.map((metric) => (
                  <div
                    key={metric.id || metric.name}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{metric.name}</p>
                      <p className="text-xs text-[#8b5cf6] font-mono mt-0.5">{metric.expression}</p>
                      {metric.description && (
                        <p className="text-[11px] text-[#64748b] mt-1">{metric.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(metric.id || metric.name)}
                      className="flex-shrink-0 p-1.5 rounded-lg text-[#4a4a6a] hover:text-[#ef4444] hover:bg-[#ef4444]/8 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Metric Form */}
          {showAddForm ? (
            <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-[#8b5cf6]/15 p-4 space-y-3">
              <p className="text-xs font-semibold text-[#a78bfa]">New Metric</p>
              <input
                type="text"
                placeholder="Metric name (e.g., Total Revenue)"
                value={newMetric.name}
                onChange={e => setNewMetric(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0e1a] border border-[rgba(255,255,255,0.08)] text-sm text-white placeholder:text-[#4a4a6a] outline-none focus:border-[#8b5cf6]/40 transition-colors"
              />
              <input
                type="text"
                placeholder="Expression (e.g., SUM(amount))"
                value={newMetric.expression}
                onChange={e => setNewMetric(prev => ({ ...prev, expression: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0e1a] border border-[rgba(255,255,255,0.08)] text-sm text-white placeholder:text-[#4a4a6a] outline-none focus:border-[#8b5cf6]/40 transition-colors font-mono"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newMetric.description}
                onChange={e => setNewMetric(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0e1a] border border-[rgba(255,255,255,0.08)] text-sm text-white placeholder:text-[#4a4a6a] outline-none focus:border-[#8b5cf6]/40 transition-colors"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowAddForm(false); setNewMetric({ name: '', expression: '', description: '' }); }}
                  className="px-4 py-2 rounded-lg text-xs text-[#94a3b8] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMetric}
                  disabled={!newMetric.name.trim() || !newMetric.expression.trim()}
                  className="btn-primary text-xs !py-2 !px-4 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add Metric
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[rgba(255,255,255,0.1)] text-xs font-medium text-[#64748b] hover:text-[#a78bfa] hover:border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/5 transition-all duration-200"
            >
              <Plus size={14} />
              Add Custom Metric
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <span className="text-[10px] text-[#4a4a6a]">
            {metrics.length} metric{metrics.length !== 1 ? 's' : ''} defined
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#94a3b8] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-xs !py-2 !px-5 flex items-center gap-1.5"
            >
              <Save size={13} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

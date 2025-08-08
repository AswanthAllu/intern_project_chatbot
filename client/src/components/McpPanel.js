import React, { useState } from 'react';

export default function McpPanel({ isMcpEnabled, setIsMcpEnabled, onMcpSearch }) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const callPipeline = async () => {
        if (!input.trim()) return;
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/agents/pipeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: input.trim() })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Pipeline failed');
            const out = data.data?.answer || data.data?.result?.answer || JSON.stringify(data.data);
            setResult(out);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const callCrew = async () => {
        if (!input.trim()) return;
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/agents/pipeline/crewai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: input.trim() })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'CrewAI pipeline failed');
            // Show only final answer string
            const out = data.data?.answer || data.data?.result?.answer || JSON.stringify(data.data);
            setResult(out);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const callOllamaAgent = async () => {
        if (!input.trim()) return;
        setLoading(true); setError('');
        try {
            const res = await fetch('/api/agents/ollama', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: input.trim() })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Ollama agent failed');
            const out = data.data?.answer || data.data?.response || JSON.stringify(data.data);
            setResult(out);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMcpSearch = () => {
        if (onMcpSearch && input.trim()) {
            onMcpSearch(input.trim());
        }
    };

    return (
        <div style={{ border: '1px solid #3c4043', borderRadius: 8, padding: 16, marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>MCP Agents</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={isMcpEnabled}
                        onChange={(e) => setIsMcpEnabled(e.target.checked)}
                        style={{ margin: 0 }}
                    />
                    <span style={{ fontSize: '14px' }}>Enable MCP for Search</span>
                </label>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                    style={{ flex: 1 }}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && !loading && callPipeline()}
                    placeholder="Ask something..."
                />
                <button onClick={callPipeline} disabled={loading}>
                    {loading ? 'Running...' : 'Pipeline'}
                </button>
                <button onClick={callCrew} disabled={loading}>
                    {loading ? 'Running...' : 'CrewAI'}
                </button>
                <button onClick={callOllamaAgent} disabled={loading}>
                    {loading ? 'Running...' : 'Ollama'}
                </button>
            </div>
            {isMcpEnabled && (
                <div style={{ marginBottom: 8 }}>
                    <button
                        onClick={handleMcpSearch}
                        disabled={loading || !input.trim()}
                        style={{
                            backgroundColor: '#4285f4',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 4,
                            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                            opacity: loading || !input.trim() ? 0.6 : 1
                        }}
                    >
                        Search with MCP
                    </button>
                    <span style={{ marginLeft: 8, fontSize: '12px', color: '#9aa0a6' }}>
                        This will use MCP agents for your normal search
                    </span>
                </div>
            )}
            {error && <div style={{ color: '#f88', marginTop: 8 }}>Error: {error}</div>}
            {!!result && (
                <div style={{ whiteSpace: 'pre-wrap', background: '#1e1f20', padding: 12, marginTop: 12, borderRadius: 4 }}>
                    {result}
                </div>
            )}
        </div>
    );
}

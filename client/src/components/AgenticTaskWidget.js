import React, { useState } from 'react';
import { submitAgenticTask } from '../services/agenticApi';

export default function AgenticTaskWidget() {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await submitAgenticTask(prompt);
            setResult(res);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: 16, borderRadius: 8, margin: 16 }}>
            <h3>Agentic System Task</h3>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Enter your task prompt..."
                    style={{ width: '80%' }}
                />
                <button type="submit" disabled={loading} style={{ marginLeft: 8 }}>
                    {loading ? 'Processing...' : 'Submit'}
                </button>
            </form>
            {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
            {result && (
                <pre style={{ marginTop: 16, background: '#f9f9f9', padding: 8, borderRadius: 4 }}>
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </div>
    );
}

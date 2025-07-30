// agenticApi.js
export async function submitAgenticTask(prompt) {
    const response = await fetch('/api/agentic-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error('Agentic API error');
    const data = await response.json();
    return data.result;
}

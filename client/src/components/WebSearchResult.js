import React from 'react';

export default function WebSearchResult({ results }) {
  if (!results || results.length === 0) return <div>No web results found.</div>;
  return (
    <div>
      <strong>Web Results:</strong>
      <ul>
        {results.map((item, idx) => (
          <li key={idx}>
            <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
} 
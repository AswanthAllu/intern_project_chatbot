// client/src/components/WebSearchResult.js
import React from 'react';
import { Card, CardContent, Typography, Link, Box, Chip, IconButton, Alert } from '@mui/material';
import { FaExternalLinkAlt, FaSearch, FaClock, FaInfoCircle } from 'react-icons/fa';

const WebSearchResult = ({ results, query, isLoading, error }) => {
    if (isLoading) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    🔍 Searching the web for "{query}"...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    ❌ Error: {error}
                </Alert>
            </Box>
        );
    }

    if (!results || results.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                        No web search results found for "{query}"
                    </Typography>
                </Alert>
                
                <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <FaInfoCircle size={16} color="#1976d2" style={{ marginRight: '8px' }} />
                            <Typography variant="h6" component="h3">
                                Search Tips
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Try these suggestions to improve your search:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, m: 0 }}>
                            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                Use more specific keywords
                            </Typography>
                            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                Check your spelling
                            </Typography>
                            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                Try different search terms
                            </Typography>
                            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                                Break down complex queries
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    const handleLinkClick = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <FaSearch size={16} color="#1976d2" />
                <Typography variant="h6" component="h3">
                    Web Search Results
                </Typography>
                <Chip 
                    label={`${results.length} results`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Search query: "{query}"
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {results.map((result, index) => (
                    <Card key={index} variant="outlined" sx={{ 
                        '&:hover': { 
                            boxShadow: 2,
                            borderColor: 'primary.main'
                        },
                        transition: 'all 0.2s ease-in-out'
                    }}>
                        <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography 
                                    variant="h6" 
                                    component="h4" 
                                    sx={{ 
                                        fontWeight: 600,
                                        color: 'primary.main',
                                        cursor: 'pointer',
                                        '&:hover': { textDecoration: 'underline' }
                                    }}
                                    onClick={() => handleLinkClick(result.url)}
                                >
                                    {result.title}
                                </Typography>
                                <IconButton 
                                    size="small" 
                                    onClick={() => handleLinkClick(result.url)}
                                    sx={{ ml: 1 }}
                                    title="Open in new tab"
                                >
                                    <FaExternalLinkAlt size={14} />
                                </IconButton>
                            </Box>
                            
                            {result.snippet && (
                                <Typography 
                                    variant="body2" 
                                    color="text.secondary" 
                                    sx={{ mb: 1, lineHeight: 1.5 }}
                                >
                                    {result.snippet}
                                </Typography>
                            )}
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Link 
                                    href={result.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    variant="body2"
                                    sx={{ 
                                        fontSize: '0.75rem',
                                        color: 'text.secondary',
                                        textDecoration: 'none',
                                        '&:hover': { textDecoration: 'underline' }
                                    }}
                                >
                                    {new URL(result.url).hostname}
                                </Link>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaClock size={12} />
                    Powered by DuckDuckGo • Results may vary • Educational content included
                </Typography>
            </Box>
        </Box>
    );
};

export default WebSearchResult; 
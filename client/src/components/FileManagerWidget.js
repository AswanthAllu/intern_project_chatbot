// client/src/components/FileManagerWidget.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Popover, MenuList, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { FiRefreshCw, FiTrash2, FiPlayCircle, FiHeadphones, FiMoreVertical, FiClock } from 'react-icons/fi';
import { useChat } from '../context/ChatContext';
import {
    getUserFiles,
    renameUserFile,
    deleteUserFile,
    analyzeDocument,
    generatePodcast,
    getPodcastStatus,
    getPodcastDownloadUrl
} from '../services/api';
import { LLM_OPTIONS } from '../config/constants';

// ... (Helper functions getFileIcon, formatFileSize are unchanged)
const getFileIcon = (type) => {
    switch (type) {
        case 'docs':
            return '📄';
        case 'images':
            return '🖼️';
        case 'code':
            return '💻';
        default:
            return '📁';
    }
};
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (typeof bytes !== 'number' || bytes < 0) return 'N/A';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const index = Math.max(0, Math.min(i, sizes.length - 1));
    return parseFloat((bytes / Math.pow(k, index)).toFixed(1)) + ' ' + sizes[index];
};


const FileManagerWidget = ({ refreshTrigger }) => {
    const { addMessage } = useChat();

    // --- State hooks ---
    const [userFiles, setUserFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [popoverAnchorEl, setPopoverAnchorEl] = useState(null);
    const [activeFileForMenu, setActiveFileForMenu] = useState(null);
    const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);
    const [analysisModalData, setAnalysisModalData] = useState(null);

    // ✅ REMOVED: The podcast task state is now managed inside the ChatPage
    // const [podcastTasks, setPodcastTasks] = useState({});
    // const pollingIntervals = useRef({});

    const fetchUserFiles = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await getUserFiles();
            setUserFiles(response.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load files.');
            setUserFiles([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserFiles();
    }, [refreshTrigger, fetchUserFiles]);

    // --- Popover Handlers (Unchanged) ---
    const handleMenuOpen = (event, file) => {
        setPopoverAnchorEl(event.currentTarget);
        setActiveFileForMenu(file);
    };
    const handleMenuClose = () => {
        setPopoverAnchorEl(null);
        setActiveFileForMenu(null);
    };

    // --- Action Handlers ---
    const handleDeleteFile = async () => {
        if (!activeFileForMenu) return;
        if (!window.confirm(`Are you sure you want to delete "${activeFileForMenu.originalName}"?`)) return;
        setError('');
        try {
            await deleteUserFile(activeFileForMenu.serverFilename);
            fetchUserFiles();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete file.');
        }
        handleMenuClose();
    };

    const handleOpenAnalysisModal = () => {
        setAnalysisModalData({
            file: activeFileForMenu,
            type: 'faq',
            provider: 'gemini',
            model: LLM_OPTIONS['gemini']?.models[0] || ''
        });
        setAnalysisModalOpen(true);
        handleMenuClose();
    };

    const handleRunAnalysis = async (analysisConfig) => {
        const { file, type, provider, model } = analysisConfig;
        addMessage({ role: 'model', parts: [{ text: `Running **${type}** analysis on *${file.originalName}*...` }] });
        setAnalysisModalOpen(false);
        try {
            const payload = {
                documentName: file.originalName,
                serverFilename: file.serverFilename,
                analysisType: type,
                llmProvider: provider,
                llmModelName: model || null,
            };
            const response = await analyzeDocument(payload);
            if (response.data?.status === 'success') {
                let formattedResult = `### Analysis Result: ${type} for *${file.originalName}*\n\n`;
                if (type === 'mindmap') {
                    formattedResult += '```mermaid\n' + response.data.analysis_result + '\n```';
                } else {
                    formattedResult += response.data.analysis_result;
                }
                addMessage({ role: 'model', parts: [{ text: formattedResult }], thinking: response.data.thinking_content });
            } else {
                throw new Error(response.data?.message || "Analysis failed.");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Failed to perform analysis.";
            addMessage({ role: 'model', parts: [{ text: `**Analysis Failed:** ${errorMsg}` }], isError: true });
        }
    };

    // ✅ UPDATED: This function now just starts the process and adds a special message to the chat context.
    const handleGeneratePodcast = async () => {
        if (!activeFileForMenu) return;
        const { serverFilename, originalName } = activeFileForMenu;
        handleMenuClose(); // Close the menu immediately
        try {
            const { data } = await generatePodcast(serverFilename, originalName);
            if (data.task_id) {
                // Add a special message to the chat context with the task ID
                addMessage({
                    role: 'model',
                    parts: [{ text: `Generating podcast for *${originalName}*...` }],
                    task: {
                        id: data.task_id,
                        type: 'podcast',
                        status: 'processing',
                        originalName: originalName
                    }
                });
            } else {
                throw new Error("Failed to get a task ID from the server.");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to start generation.';
            addMessage({ role: 'model', parts: [{ text: `**Podcast Failed:** ${errorMsg}` }], isError: true });
        }
    };

    // --- Render Logic ---
    return (
        <>
            <div className="file-manager-widget sidebar-panel">
                <div className="fm-header">
                    <h3 className="sidebar-header">Your Uploaded Files</h3>
                    <button onClick={fetchUserFiles} disabled={isLoading} className="fm-refresh-btn" title="Refresh File List">
                        <FiRefreshCw size={16} />
                    </button>
                </div>
                {error && <div className="fm-error">{error}</div>}
                <div className="fm-file-list-container">
                    {isLoading ? <p className="fm-loading">Loading files...</p> : userFiles.length === 0 ? <p className="fm-empty">No files uploaded yet.</p> : (
                        <ul className="fm-file-list">
                            {userFiles.map((file) => (
                                <li key={file.serverFilename} className="fm-file-item">
                                    <span className="fm-file-icon">{getFileIcon(file.type)}</span>
                                    <div className="fm-file-details">
                                        <span className="fm-file-name" title={file.originalName}>{file.originalName}</span>
                                        <span className="fm-file-size">{formatFileSize(file.size)}</span>
                                    </div>
                                    <div className="fm-file-actions">
                                        <button onClick={(e) => handleMenuOpen(e, file)} className="fm-action-btn" title="More Actions">
                                            <FiMoreVertical size={16} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <Popover
                open={Boolean(popoverAnchorEl)}
                anchorEl={popoverAnchorEl}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuList>
                    <MenuItem onClick={handleGeneratePodcast}>
                        <ListItemIcon><FiHeadphones fontSize="small" /></ListItemIcon>
                        <ListItemText>Generate Podcast</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleOpenAnalysisModal}>
                        <ListItemIcon><FiPlayCircle fontSize="small" /></ListItemIcon>
                        <ListItemText>Run Analysis</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleDeleteFile} sx={{ color: 'error.main' }}>
                        <ListItemIcon><FiTrash2 fontSize="small" color="error" /></ListItemIcon>
                        <ListItemText>Delete File</ListItemText>
                    </MenuItem>
                </MenuList>
            </Popover>

            {isAnalysisModalOpen && (
                <AnalysisConfigModal
                    open={isAnalysisModalOpen}
                    onClose={() => setAnalysisModalOpen(false)}
                    onRun={handleRunAnalysis}
                    config={analysisModalData}
                    setConfig={setAnalysisModalData}
                />
            )}
        </>
    );
};

// ... (AnalysisConfigModal component is unchanged)
const AnalysisConfigModal = ({ open, onClose, onRun, config, setConfig }) => {
    if (!open) return null;
    const handleProviderChange = (e) => {
        const newProvider = e.target.value;
        setConfig(prev => ({
            ...prev,
            provider: newProvider,
            model: LLM_OPTIONS[newProvider]?.models[0] || ''
        }));
    };
    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h3>Configure Analysis for *{config.file.originalName}*</h3>
                <div className="fm-analysis-options">
                    <select value={config.type} onChange={(e) => setConfig(p => ({ ...p, type: e.target.value }))}>
                        <option value="faq">Generate FAQ</option>
                        <option value="topics">Identify Topics</option>
                        <option value="mindmap">Create Mindmap</option>
                    </select>
                    <select value={config.provider} onChange={handleProviderChange}>
                        {Object.keys(LLM_OPTIONS).map(key => (
                            <option key={key} value={key}>{LLM_OPTIONS[key].name}</option>
                        ))}
                    </select>
                    {LLM_OPTIONS[config.provider]?.models.length > 0 && (
                        <select value={config.model} onChange={(e) => setConfig(p => ({ ...p, model: e.target.value }))}>
                            {LLM_OPTIONS[config.provider].models.map(m => <option key={m} value={m}>{m}</option>)}
                            <option value="">Provider Default</option>
                        </select>
                    )}
                </div>
                <div className="modal-actions">
                    <button onClick={onClose} className="secondary-button">Cancel</button>
                    <button onClick={() => onRun(config)} className="primary-button">Run</button>
                </div>
            </div>
        </div>
    );
};


export default FileManagerWidget;
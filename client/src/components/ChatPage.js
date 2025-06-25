// client/src/components/ChatPage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from 'jspdf';
import mermaid from 'mermaid';

import { sendMessage, saveChatHistory, getPodcastStatus } from '../services/api';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { LLM_OPTIONS } from '../config/constants';

import SystemPromptWidget, { getPromptTextById } from './SystemPromptWidget';
import HistoryModal from './HistoryModal';
import FileUploadWidget from './FileUploadWidget';
import FileManagerWidget from './FileManagerWidget';
import VoiceInputButton from './VoiceInputButton';

import { FiMessageSquare, FiDatabase, FiSettings, FiLogOut, FiSun, FiMoon, FiSend, FiPlus, FiArchive, FiShield, FiDownload, FiRefreshCw, FiX } from 'react-icons/fi';
import './ChatPage.css';

// --- Task Status Component ---
const TaskStatusMessage = ({ message }) => {
    const { setMessages } = useChat();
    const [taskStatus, setTaskStatus] = useState(message.task.status);
    const [taskResult, setTaskResult] = useState(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        const poll = async () => {
            try {
                const { data } = await getPodcastStatus(message.task.id);
                if (data.status === 'complete' || data.status === 'failed') {
                    setTaskStatus(data.status);
                    setTaskResult(data);
                    clearInterval(intervalRef.current);
                } else {
                    setTaskStatus(data.status);
                }
            } catch (error) {
                console.error("Polling failed:", error);
                setTaskStatus('failed');
                setTaskResult({ error: 'Polling failed.' });
                clearInterval(intervalRef.current);
            }
        };

        if (taskStatus === 'processing') {
            intervalRef.current = setInterval(poll, 5000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [taskStatus, message.task.id]);

    useEffect(() => {
        if (taskStatus === 'complete' || taskStatus === 'failed') {
            setMessages(prev => prev.map(m => 
                m.key === message.key 
                ? { ...m, task: { ...m.task, status: taskStatus, result: taskResult } } 
                : m
            ));
        }
    }, [taskStatus, taskResult, message.key, setMessages]);

    return (
        <div className="message-text">
            {taskStatus === 'processing' && (
                <div className="task-status-indicator">
                    <FiRefreshCw className="spin" />
                    <span>Generating podcast for *{message.task.originalName}*...</span>
                </div>
            )}
            {taskStatus === 'failed' && (
                <div className="task-status-indicator error">
                    <FiX />
                    <span>Podcast generation failed: {taskResult?.error || 'Unknown error'}</span>
                </div>
            )}
            {taskStatus === 'complete' && taskResult?.audioUrl && (
                <div>
                    <p>🎙️ Podcast for *{message.task.originalName}* is ready!</p>
                    <audio controls src={taskResult.audioUrl} style={{ width: '100%', marginTop: '10px' }}>
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}
        </div>
    );
};

// --- UI Sub-Components (Unchanged) ---
const ActivityBar = ({ activeView, setActiveView }) => (
    <div className="activity-bar">
        <button className={`activity-button ${activeView === 'ASSISTANT' ? 'active' : ''}`} onClick={() => setActiveView('ASSISTANT')} title="Assistant Settings">
            <FiSettings size={24} />
        </button>
        <button className={`activity-button ${activeView === 'DATA' ? 'active' : ''}`} onClick={() => setActiveView('DATA')} title="Data Sources">
            <FiDatabase size={24} />
        </button>
    </div>
);
const AssistantSettingsPanel = (props) => (
    <div className="sidebar-panel">
        <h3 className="sidebar-header">Assistant Settings</h3>
        <SystemPromptWidget
            selectedPromptId={props.currentSystemPromptId}
            promptText={props.editableSystemPromptText}
            onSelectChange={props.handlePromptSelectChange}
            onTextChange={props.handlePromptTextChange}
        />
        <div className="llm-settings-widget">
            <h4>AI Settings</h4>
            <div className="setting-item">
                <label htmlFor="llm-provider-select">Provider:</label>
                <select id="llm-provider-select" value={props.llmProvider} onChange={props.handleLlmProviderChange} disabled={props.isProcessing}>
                    {Object.keys(LLM_OPTIONS).map(key => (
                        <option key={key} value={key}>{LLM_OPTIONS[key].name}</option>
                    ))}
                </select>
            </div>
            {LLM_OPTIONS[props.llmProvider]?.models.length > 0 && (
                <div className="setting-item">
                    <label htmlFor="llm-model-select">Model:</label>
                    <select id="llm-model-select" value={props.llmModelName} onChange={props.handleLlmModelChange} disabled={props.isProcessing}>
                        {LLM_OPTIONS[props.llmProvider].models.map(model => <option key={model} value={model}>{model}</option>)}
                        <option value="">Provider Default</option>
                    </select>
                </div>
            )}
            <div className="setting-item rag-toggle-container" title="Enable Multi-Query for RAG">
                <label htmlFor="multi-query-toggle">Multi-Query (RAG)</label>
                <input type="checkbox" id="multi-query-toggle" checked={props.enableMultiQuery} onChange={props.handleMultiQueryToggle} disabled={props.isProcessing || !props.isRagEnabled} />
            </div>
        </div>
    </div>
);
const DataSourcePanel = (props) => (
    <div className="sidebar-panel">
        <h3 className="sidebar-header">Data Sources</h3>
        <FileUploadWidget onUploadSuccess={props.triggerFileRefresh} />
        <FileManagerWidget refreshTrigger={props.refreshTrigger} />
    </div>
);
const Sidebar = ({ activeView, ...props }) => (
    <div className="sidebar-area">
        {activeView === 'ASSISTANT' && <AssistantSettingsPanel {...props} />}
        {activeView === 'DATA' && <DataSourcePanel {...props} />}
    </div>
);
const ThemeToggleButton = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button onClick={toggleTheme} className="header-button theme-toggle-button" title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}>
            {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
        </button>
    );
};

// ===================================================================================
//  Main ChatPage Component
// ===================================================================================
const ChatPage = ({ setIsAuthenticated }) => {
    const { messages, sessionId, addMessage, resetChat, loadSession } = useChat();

    // --- Local UI State ---
    const [activeView, setActiveView] = useState('ASSISTANT');
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [username, setUsername] = useState('');
    const [userRole, setUserRole] = useState(null);
    const [currentSystemPromptId, setCurrentSystemPromptId] = useState('friendly');
    const [editableSystemPromptText, setEditableSystemPromptText] = useState(() => getPromptTextById('friendly'));
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [fileRefreshTrigger, setFileRefreshTrigger] = useState(0);
    const [hasFiles, setHasFiles] = useState(false);
    const [isRagEnabled, setIsRagEnabled] = useState(false);
    const [llmProvider, setLlmProvider] = useState('gemini');
    const [llmModelName, setLlmModelName] = useState(LLM_OPTIONS['gemini']?.models[0] || '');
    const [enableMultiQuery, setEnableMultiQuery] = useState(true);

    // --- Refs & Hooks ---
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

    useEffect(() => {
        if (listening) { setInputText(transcript); }
    }, [transcript, listening]);

    useEffect(() => {
        const user = localStorage.getItem('username');
        const role = localStorage.getItem('userRole');
        setUsername(user || 'User');
        setUserRole(role);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        try { mermaid.run(); } catch(e) { console.warn("Mermaid run failed:", e); }
    }, [messages]);

    // --- Callbacks & Handlers ---
    const handlePromptSelectChange = useCallback((newId) => {
        setCurrentSystemPromptId(newId);
        setEditableSystemPromptText(getPromptTextById(newId));
    }, []);

    const saveAndReset = useCallback(async (isLoggingOut = false, onCompleteCallback = null) => {
        const messagesToSave = messages.filter(m => m.role && m.parts);
        if (!sessionId || messagesToSave.length === 0 || isLoading) {
            if (onCompleteCallback) onCompleteCallback();
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await saveChatHistory({ sessionId, messages: messagesToSave });
            resetChat();
            if (!isLoggingOut) handlePromptSelectChange('friendly');
        } catch (err) {
            setError(`Session Error: ${err.response?.data?.message || 'Failed to save session.'}`);
        } finally {
            setIsLoading(false);
            if (onCompleteCallback) onCompleteCallback();
        }
    }, [messages, sessionId, isLoading, resetChat, handlePromptSelectChange]);

    const performLogoutCleanup = useCallback(() => {
        localStorage.clear();
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
    }, [setIsAuthenticated, navigate]);

    const handleLogout = useCallback(() => saveAndReset(true, performLogoutCleanup), [saveAndReset, performLogoutCleanup]);

    const handleSendMessage = useCallback(async (e) => {
        if (e) e.preventDefault();
        const textToSend = inputText.trim();
        if (!textToSend || isLoading) return;
        SpeechRecognition.stopListening();
        setIsLoading(true);
        setError('');
        
        const newUserMessage = { role: 'user', parts: [{ text: textToSend }] };
        addMessage(newUserMessage);
        
        setInputText('');
        resetTranscript();
        
        const currentHistory = [...messages, newUserMessage];
        const messageData = {
            message: textToSend,
            history: currentHistory.map(m => ({ role: m.role, parts: m.parts })),
            sessionId,
            systemPrompt: editableSystemPromptText,
            isRagEnabled, llmProvider, llmModelName: llmModelName || null, enableMultiQuery,
        };
        try {
            const response = await sendMessage(messageData);
            if (!response.data?.reply?.parts?.[0]) { throw new Error("Received an invalid response from the AI."); }
            addMessage(response.data.reply);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to get response.';
            setError(`Chat Error: ${errorMessage}`);
            addMessage({ role: 'model', parts: [{ text: `Error: ${errorMessage}` }], isError: true });
        } finally {
            setIsLoading(false);
        }
    }, [inputText, isLoading, messages, sessionId, addMessage, editableSystemPromptText, isRagEnabled, llmProvider, llmModelName, enableMultiQuery, resetTranscript]);

    const handleNewChat = useCallback(() => { if (!isLoading) { resetTranscript(); saveAndReset(false); } }, [isLoading, saveAndReset, resetTranscript]);
    const handleEnterKey = useCallback((e) => { if (e.key === 'Enter' && !e.shiftKey && !isLoading) { e.preventDefault(); handleSendMessage(e); } }, [handleSendMessage, isLoading]);
    const triggerFileRefresh = useCallback(() => setFileRefreshTrigger(p => p + 1), []);
    const handlePromptTextChange = useCallback((newText) => { setEditableSystemPromptText(newText); }, []);
    const handleLlmProviderChange = (e) => { const newProvider = e.target.value; setLlmProvider(newProvider); setLlmModelName(LLM_OPTIONS[newProvider]?.models[0] || ''); };
    const handleLlmModelChange = (e) => { setLlmModelName(e.target.value); };
    const handleRagToggle = (e) => setIsRagEnabled(e.target.checked);
    const handleMultiQueryToggle = (e) => setEnableMultiQuery(e.target.checked);
    const handleHistory = useCallback(() => setIsHistoryModalOpen(true), []);
    const closeHistoryModal = useCallback(() => setIsHistoryModalOpen(false), []);
    const handleSessionSelectForContinuation = useCallback((sessionData) => {
        loadSession(sessionData);
        setError('');
        closeHistoryModal();
    }, [loadSession, closeHistoryModal]);
    const handleToggleListen = () => { if (listening) { SpeechRecognition.stopListening(); } else { resetTranscript(); SpeechRecognition.startListening({ continuous: true }); } };
    const handleDownloadChat = useCallback(() => {
        if (messages.length === 0) return;
        const doc = new jsPDF();
        let y = 10;
        doc.setFontSize(12);
        messages.forEach((msg) => {
            const sender = msg.role === 'user' ? username || 'User' : 'Assistant';
            const text = msg.parts.map(part => part.text).join(' ');
            const lines = doc.splitTextToSize(`${sender}: ${text}`, 180);
            if (y + lines.length * 10 > 280) { doc.addPage(); y = 10; }
            doc.text(lines, 10, y);
            y += lines.length * 10;
        });
        doc.save('chat_history.pdf');
    }, [messages, username]);

    const sidebarProps = {
        currentSystemPromptId, editableSystemPromptText, handlePromptSelectChange, handlePromptTextChange,
        llmProvider, handleLlmProviderChange, isProcessing: isLoading, llmModelName, handleLlmModelChange,
        enableMultiQuery, handleMultiQueryToggle, isRagEnabled, triggerFileRefresh, refreshTrigger: fileRefreshTrigger,
    };

    // --- Render ---
    return (
        <div className="main-layout">
            <ActivityBar activeView={activeView} setActiveView={setActiveView} />
            <Sidebar activeView={activeView} {...sidebarProps} />
            <div className="chat-view">
                <header className="chat-header">
                    <h1>FusedChat</h1>
                    <div className="header-controls">
                        <span className="username-display">Hi, {username}</span>
                        <ThemeToggleButton />
                        <button onClick={handleHistory} className="header-button" title="Chat History" disabled={isLoading}><FiArchive size={20} /></button>
                        <button onClick={handleNewChat} className="header-button" title="New Chat" disabled={isLoading}><FiPlus size={20} /></button>
                        <button onClick={() => navigate('/settings')} className="header-button" title="Settings" disabled={isLoading}><FiSettings size={20} /></button>
                        {userRole === 'admin' && (
                            <button onClick={() => navigate('/admin')} className="header-button admin-button" title="Admin Panel">
                                <FiShield size={20} />
                            </button>
                        )}
                        <button onClick={handleLogout} className="header-button" title="Logout" disabled={isLoading}><FiLogOut size={20} /></button>
                        <button onClick={handleDownloadChat} className="header-button" title="Download Chat" disabled={messages.length === 0}><FiDownload size={20} /></button>
                    </div>
                </header>
                <main className="messages-area">
                    {messages.length === 0 && !isLoading && (
                         <div className="welcome-screen">
                            <FiMessageSquare size={48} className="welcome-icon" />
                            <h2>Start a conversation</h2>
                            <p>Ask a question, upload a document, or select a model to begin.</p>
                         </div>
                    )}
                    {messages.map((msg) => (
                        <div key={msg.key} className={`message ${msg.role.toLowerCase()}${msg.isError ? '-error-message' : ''}`}>
                            <div className="message-content-wrapper">
                                <p className="message-sender-name">{msg.role === 'user' ? username : 'Assistant'}</p>
                                {msg.task && msg.task.type === 'podcast' ? (
                                    <TaskStatusMessage message={msg} />
                                ) : (
                                    <div className="message-text"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.parts[0].text}</ReactMarkdown></div>
                                )}
                                {msg.thinking && <details className="message-thinking-trace"><summary>Thinking Process</summary><pre>{msg.thinking}</pre></details>}
                                {msg.references?.length > 0 && <div className="message-references"><strong>References:</strong><ul>{msg.references.map((ref, i) => <li key={i} title={ref.preview_snippet}>{ref.documentName} (Score: {ref.score?.toFixed(2)})</li>)}</ul></div>}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </main>
                <div className="indicator-container">
                    {isLoading && <div className="loading-indicator"><span>Thinking...</span></div>}
                    {!isLoading && error && <div className="error-indicator">{error}</div>}
                </div>
                <footer className="input-area">
                    <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleEnterKey} placeholder="Type or say something..." rows="1" disabled={isLoading} />
                    <VoiceInputButton isListening={listening} onToggleListen={handleToggleListen} isSupported={browserSupportsSpeechRecognition} />
                    <div className="rag-toggle-container" title={!hasFiles ? "Upload files to enable RAG" : "Toggle RAG"}>
                        <label htmlFor="rag-toggle">RAG</label>
                        <input type="checkbox" id="rag-toggle" checked={isRagEnabled} onChange={handleRagToggle} disabled={!hasFiles || isLoading} />
                    </div>
                    <button onClick={handleSendMessage} disabled={isLoading || !inputText.trim()} title="Send Message" className="send-button">
                        <FiSend size={20} />
                    </button>
                </footer>
            </div>
            <HistoryModal isOpen={isHistoryModalOpen} onClose={closeHistoryModal} onSessionSelect={handleSessionSelectForContinuation} />
        </div>
    );
};

export default ChatPage;
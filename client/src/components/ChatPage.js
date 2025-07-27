<<<<<<< HEAD
<<<<<<< HEAD
// client/src/components/ChatPage.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    sendMessage as apiSendMessage, saveChatHistory, queryRagService, generatePodcast, generateMindMap,
    getUserFiles, deleteUserFile, renameUserFile, performDeepSearch,
=======
=======
// src/components/ChatPage.js
>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    sendMessage as apiSendMessage, saveChatHistory, generatePodcast, generateMindMap,
    getUserFiles, deleteUserFile, renameUserFile, performDeepSearch,
<<<<<<< HEAD
    queryHybridRagService,
>>>>>>> upstream/main
=======
    queryHybridRagService, getSessionDetails
>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd
} from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';
<<<<<<< HEAD
<<<<<<< HEAD
import { FaBars, FaPlus, FaTools, FaMicrophone, FaSearch, FaRegObjectGroup } from 'react-icons/fa';
import { Popover } from 'react-tiny-popover';

import SystemPromptWidget, { availablePrompts, getPromptTextById } from './SystemPromptWidget';
=======
import { FaBars, FaPlus, FaTools, FaMicrophone, FaPaperPlane } from 'react-icons/fa';
import { Popover } from 'react-tiny-popover';

import SystemPromptWidget from './SystemPromptWidget';
import { availablePrompts, getPromptTextById } from '../utils/prompts'; 
>>>>>>> upstream/main
=======
import { FaBars, FaPaperPlane, FaMicrophone, FaHistory, FaPlus, FaCog, FaFolderOpen, FaSignOutAlt } from 'react-icons/fa';
import { Popover, Typography, Button, Box, IconButton as MuiIconButton } from '@mui/material';

>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd
import FileUploadWidget from './FileUploadWidget';
import FileManagerWidget from './FileManagerWidget';
import HistorySidebarWidget from './HistorySidebarWidget';
import SettingsWidget from './SettingsWidget';
import MindMap from './MindMap';
<<<<<<< HEAD
import HistoryModal from './HistoryModal';
<<<<<<< HEAD
import WebSearchResult from './WebSearchResult';
import { webSearch } from '../services/webSearch';
=======
>>>>>>> upstream/main
=======
import { getPromptTextById, availablePrompts } from '../utils/prompts';
>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd

import './ChatPage.css';

const GeminiIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scale(1.2)' }}>
        <path d="M12 2.75L13.2319 8.26814L15.1914 5.80859L15.7319 8.73186L19.1914 7.80859L17.2319 10.2681L20.1914 11.8086L17.7319 12.2681L18.1914 14.8086L15.2319 13.7681L14.1914 16.1914L12.7319 13.2681L12 15.25L11.2681 13.2681L9.80859 16.1914L8.76814 13.7681L5.80859 14.8086L6.26814 12.2681L3.80859 11.8086L6.76814 10.2681L4.80859 7.80859L8.26814 8.73186L8.80859 5.80859L10.7681 8.26814L12 2.75Z" fill="url(#gemini-gradient)" />
        <defs>
            <linearGradient id="gemini-gradient" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8957E9" />
                <stop offset="1" stopColor="#7094E6" />
            </linearGradient>
        </defs>
    </svg>
);


const ChatPage = ({ setIsAuthenticated }) => {
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(window.innerWidth > 1024);
    const [sidebarView, setSidebarView] = useState('files');
    const [profileAnchorEl, setProfileAnchorEl] = useState(null);
    const [loadingStates, setLoadingStates] = useState({
        chat: false, files: false, podcast: false, mindMap: false, deepSearch: false, listening: false
    });
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [error, setError] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [userId, setUserId] = useState('');
    const [username, setUsername] = useState('');
    const [currentSystemPromptId, setCurrentSystemPromptId] = useState('friendly');
    const [editableSystemPromptText, setEditableSystemPromptText] = useState(() => getPromptTextById('friendly'));
    const [files, setFiles] = useState([]);
    const [fileError, setFileError] = useState('');
    const [isRagEnabled, setIsRagEnabled] = useState(false);
<<<<<<< HEAD
=======
    const [allowRagDeepSearch, setAllowRagDeepSearch] = useState(true);
>>>>>>> upstream/main
    const [isDeepSearchEnabled, setIsDeepSearchEnabled] = useState(false);
    const [activeFileForRag, setActiveFileForRag] = useState(null);
    const [currentlySpeakingIndex, setCurrentlySpeakingIndex] = useState(null);

    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const navigate = useNavigate();
    const isProcessing = Object.values(loadingStates).some(Boolean);
    const handleProfileClick = (event) => setProfileAnchorEl(event.currentTarget);
    const handleProfileClose = () => setProfileAnchorEl(null);
    const isProfileOpen = Boolean(profileAnchorEl);

    // New handler to close sidebar on mobile after an action
    const handleSidebarAction = () => {
        if (window.innerWidth < 1024) {
            setIsSidebarExpanded(false);
        }
    };

<<<<<<< HEAD
    // This useEffect is correct and will now work with the modified JSX
=======
>>>>>>> upstream/main
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const saveAndReset = useCallback(async (isLoggingOut = false, onCompleteCallback = null) => {
        const currentSessionId = localStorage.getItem('sessionId');
        const currentUserId = localStorage.getItem('userId');
        if (!currentSessionId || !currentUserId || isProcessing || messages.length === 0) {
            if (onCompleteCallback) onCompleteCallback();
            return;
        }
        try {
            const firstUserMessage = messages.find(m => m.role === 'user');
            const chatTitle = firstUserMessage ? firstUserMessage.parts[0].text.substring(0, 50) : 'New Conversation';
            await saveChatHistory({ sessionId: currentSessionId, messages, systemPrompt: editableSystemPromptText, title: chatTitle });
        } catch (saveError) {
            console.error("Failed to save chat history:", saveError);
        } finally {
            if (!isLoggingOut) {
                setMessages([]);
                const newSessionId = uuidv4();
                setSessionId(newSessionId);
                localStorage.setItem('sessionId', newSessionId);
            }
            if (onCompleteCallback) onCompleteCallback();
        }
    }, [messages, isProcessing, editableSystemPromptText]);

    const handleLogout = useCallback((skipSave = false) => {
        const performCleanup = () => {
<<<<<<< HEAD
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
=======
            if (window.speechSynthesis) window.speechSynthesis.cancel();
>>>>>>> upstream/main
            localStorage.clear();
            setIsAuthenticated(false);
            navigate('/login', { replace: true });
        };
        if (!skipSave && messages.length > 0) {
            saveAndReset(true, performCleanup);
        } else {
            performCleanup();
        }
    }, [messages.length, setIsAuthenticated, navigate, saveAndReset]);

    useEffect(() => {
<<<<<<< HEAD
        const handleStorage = (event) => {
            if (event.key === 'userId' && !event.newValue) {
                setIsAuthenticated(false);
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [setIsAuthenticated]);

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        const storedUsername = localStorage.getItem('username');
        if (!storedUserId || !storedUsername) {
            setIsAuthenticated(false);
        } else {
            setIsAuthenticated(true);
        }
    }, [setIsAuthenticated]);

    useEffect(() => {
=======
>>>>>>> upstream/main
        const storedUserId = String(localStorage.getItem('userId'));
        const storedUsername = localStorage.getItem('username');
        if (!storedUserId || !storedUsername) {
            handleLogout(true);
        } else {
            setUserId(storedUserId);
            setUsername(storedUsername);
            const newSessionId = uuidv4();
            setSessionId(newSessionId);
            localStorage.setItem('sessionId', newSessionId);
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            recognition.onstart = () => setLoadingStates(prev => ({ ...prev, listening: true }));
            recognition.onresult = (event) => setInputText(event.results[0][0].transcript);
            recognition.onerror = (e) => setError(`STT Error: ${e.error}`);
            recognition.onend = () => setLoadingStates(prev => ({ ...prev, listening: false }));
            recognitionRef.current = recognition;
        } else {
            console.warn('Web Speech API is not supported in this browser.');
        }
        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        };
    }, [handleLogout]);

    const fetchFiles = useCallback(async () => {
        if (!userId) return;
        setLoadingStates(prev => ({ ...prev, files: true }));
<<<<<<< HEAD
        try {
            const response = await getUserFiles();
            setFiles(response.data || []);
=======
        setFileError('');
        try {
            const response = await getUserFiles();
<<<<<<< HEAD
            setFiles(response.data || []); 
>>>>>>> upstream/main
=======
            setFiles(response.data || []);
>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd
        } catch (err) {
            setFileError('Could not load files.');
        } finally {
            setLoadingStates(prev => ({ ...prev, files: false }));
        }
    }, [userId]);
    
    useEffect(() => {
        if (userId) fetchFiles();
    }, [userId, fetchFiles]);

    const handleNewChat = useCallback(() => {
        if (!isProcessing) {
            saveAndReset(false, () => {
                setSidebarView('files'); 
            });
        }
    }, [isProcessing, saveAndReset]);

    const handleSendMessage = useCallback(async (e) => {
        if (e) e.preventDefault();
        const trimmedInput = inputText.trim();
        if (!trimmedInput || isProcessing) return;
        if (loadingStates.listening) recognitionRef.current?.stop();

        const newUserMessage = { role: 'user', parts: [{ text: trimmedInput }], timestamp: new Date() };
        setMessages(prev => [...prev, newUserMessage]);
        setInputText('');
        setError('');

        const historyToSend = [...messages, newUserMessage];
        
        if (isDeepSearchEnabled) {
            setLoadingStates(prev => ({ ...prev, deepSearch: true }));
            try {
                const response = await performDeepSearch(trimmedInput);
                const deepSearchResult = {
                    role: 'assistant', type: 'deep_search',
                    parts: [{ text: response.data.message }],
                    timestamp: new Date(), metadata: response.data.metadata
                };
                setMessages(prev => [...prev, deepSearchResult]);
            } catch (err) {
                setError(`Deep Search Error: ${err.response?.data?.message || 'Deep search failed.'}`);
                setMessages(prev => prev.slice(0, -1));
            } finally {
                setLoadingStates(prev => ({ ...prev, deepSearch: false }));
            }
<<<<<<< HEAD
        }
        let fileIdForRag = activeFileForRag?.id;
        if (!fileIdForRag && files.length === 1) {
            fileIdForRag = files[0]._id || files[0].id;
        }
        if (isRagEnabled) {
            setLoadingStates(prev => ({ ...prev, chat: true }));
            try {
                const ragPayload = { query: trimmedInput, history: historyToSend, sessionId, fileId: fileIdForRag };
                const response = await queryRagService(ragPayload);
                const assistantMessage = {
                    role: 'assistant', type: 'rag',
                    parts: [{ text: response.data.message }],
                    timestamp: new Date(), metadata: response.data.metadata
=======
        } else if (isRagEnabled) {
            setLoadingStates(prev => ({ ...prev, chat: true }));
            try {
                const ragPayload = {
                    query: trimmedInput, fileId: activeFileForRag?.id, allowDeepSearch: allowRagDeepSearch
                };
                const response = await queryHybridRagService(ragPayload);
                const assistantMessage = {
                    role: 'assistant', type: response.data.metadata.searchType,
                    parts: [{ text: response.data.message }],
<<<<<<< HEAD
                    timestamp: new Date(),
                    metadata: response.data.metadata
>>>>>>> upstream/main
=======
                    timestamp: new Date(), metadata: response.data.metadata
>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd
                };
                setMessages(prev => [...prev, assistantMessage]);
            } catch (err) {
                setError(`RAG Error: ${err.response?.data?.message || 'RAG query failed.'}`);
                setMessages(prev => prev.slice(0, -1));
            } finally {
                setLoadingStates(prev => ({ ...prev, chat: false }));
            }
        } else {
            setLoadingStates(prev => ({ ...prev, chat: true }));
            try {
                const payload = { query: trimmedInput, history: historyToSend, sessionId, systemPrompt: editableSystemPromptText };
                const response = await apiSendMessage(payload);
                const assistantMessage = {
                    role: 'assistant', parts: [{ text: response.data.message }], timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
            } catch (err) {
                setError(err.response?.data?.error || 'Chat error.');
                setMessages(prev => prev.slice(0, -1));
            } finally {
                setLoadingStates(prev => ({ ...prev, chat: false }));
            }
        }
<<<<<<< HEAD
    }, [inputText, isProcessing, loadingStates, messages, isDeepSearchEnabled, isRagEnabled, activeFileForRag, sessionId, editableSystemPromptText, handleLogout, files]);

=======
    }, [
        inputText, isProcessing, loadingStates.listening, messages, isDeepSearchEnabled,
        isRagEnabled, allowRagDeepSearch, sessionId, editableSystemPromptText, activeFileForRag
    ]);
    
    const handleEnterKey = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);
<<<<<<< HEAD
    
>>>>>>> upstream/main
=======

>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd
    const handleMicButtonClick = useCallback(() => {
        if (!recognitionRef.current) return;
        if (loadingStates.listening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    }, [loadingStates.listening]);
<<<<<<< HEAD
<<<<<<< HEAD
=======
    
    const handleLoadSession = useCallback((sessionData) => {
        if (sessionData?.messages) {
            setMessages(sessionData.messages);
            setEditableSystemPromptText(sessionData.systemPrompt || getPromptTextById('friendly'));
            if (sessionData.sessionId) {
=======

    const handleLoadSession = useCallback(async (sessionIdToLoad) => {
        try {
            const response = await getSessionDetails(sessionIdToLoad);
            const sessionData = response.data;
            if (sessionData?.messages) {
                setMessages(sessionData.messages);
                setEditableSystemPromptText(sessionData.systemPrompt || getPromptTextById('friendly'));
                setCurrentSystemPromptId(availablePrompts.find(p => p.prompt === sessionData.systemPrompt)?.id || 'custom');
>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd
                setSessionId(sessionData.sessionId);
                localStorage.setItem('sessionId', sessionData.sessionId);
                setSidebarView('files');
                handleSidebarAction(); // Close sidebar on mobile after loading
            }
        } catch (err) {
            setError(`Failed to load session ${sessionIdToLoad}.`);
        }
    }, []);
<<<<<<< HEAD
>>>>>>> upstream/main

=======
    
>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd
    const handleTextToSpeech = useCallback((text, index) => {
        if (!('speechSynthesis' in window)) {
            setError('Sorry, your browser does not support text-to-speech.');
            return;
        }
        window.speechSynthesis.cancel();
        if (currentlySpeakingIndex === index) {
            setCurrentlySpeakingIndex(null);
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setCurrentlySpeakingIndex(null);
        utterance.onerror = () => {
            setError('An error occurred during speech synthesis.');
            setCurrentlySpeakingIndex(null);
        };
        setCurrentlySpeakingIndex(index);
        window.speechSynthesis.speak(utterance);
    }, [currentlySpeakingIndex]);

    const handleDeleteFile = async (fileId, fileName) => {
        if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
            try {
                await deleteUserFile(fileId);
                fetchFiles();
            } catch (err) {
                setFileError(`Could not delete ${fileName}.`);
            }
        }
    };

    const handleRenameFile = async (fileId, currentName) => {
        const newName = prompt("Enter new file name:", currentName);
        if (newName && newName !== currentName) {
            try {
                await renameUserFile(fileId, newName);
                fetchFiles();
            } catch (err) {
                setFileError(`Could not rename file.`);
            }
        }
    };
    
    const handleChatWithFile = useCallback((fileId, fileName) => {
        setActiveFileForRag({ id: fileId, name: fileName });
        setIsRagEnabled(true);
<<<<<<< HEAD
=======
        setIsDeepSearchEnabled(false);
>>>>>>> upstream/main
        setMessages(prev => [...prev, {
            role: 'system',
            parts: [{ text: `Now chatting with file: **${fileName}**` }],
            timestamp: new Date()
        }]);
    }, []);

    const handleGeneratePodcast = useCallback(async (fileId, fileName) => {
        if (isProcessing) return;
        setLoadingStates(prev => ({ ...prev, podcast: true }));
        setError('');
        setMessages(prev => [...prev, { role: 'user', parts: [{ text: `Requesting a podcast for "${fileName}"...` }], timestamp: new Date() }]);
        try {
            const response = await generatePodcast(fileId);
            const isAudioFile = response.data.podcastUrl?.endsWith('.mp3') || response.data.podcastUrl?.endsWith('.wav');
            if (isAudioFile) {
                const podcastMessage = {
                    role: 'assistant', type: 'audio',
                    parts: [{ text: `🎧 Podcast generated successfully!` }],
                    audioUrl: response.data.podcastUrl, timestamp: new Date()
                };
                setMessages(prev => [...prev, podcastMessage]);
            } else {
                throw new Error('Podcast generation failed. Audio could not be generated.');
            }
        } catch (err) {
            let errorMessageText = err.response?.data?.message || err.message || 'Failed to generate podcast.';
            if (errorMessageText.includes('Not enough content in file')) {
                errorMessageText = 'The selected file does not have enough content to generate a podcast. Please upload a longer or more detailed file.';
            }
            setError(`Podcast Error: ${errorMessageText}`);
            setMessages(prev => [...prev, { role: 'assistant', parts: [{ text: `Error generating podcast: ${errorMessageText}` }], timestamp: new Date() }]);
<<<<<<< HEAD
        } finally {
            setLoadingStates(prev => ({ ...prev, podcast: false }));
        }
=======
        }
        setLoadingStates(prev => ({ ...prev, podcast: false }));
>>>>>>> upstream/main
    }, [isProcessing]);
    
    const handleGenerateMindMap = useCallback(async (fileId, fileName) => {
        if (isProcessing) return;
        setLoadingStates(prev => ({ ...prev, mindMap: true }));
        setError('');
        setMessages(prev => [...prev, { role: 'user', parts: [{ text: `Generate a mind map for the file: ${fileName}` }], timestamp: new Date() }]);
        try {
            const response = await generateMindMap(fileId);
            const mindMapData = response.data?.mindmap || response.data;
            if (mindMapData?.nodes) {
                const mindMapMessage = {
                    role: 'assistant', type: 'mindmap',
                    parts: [{ text: `Here is the mind map for "${fileName}":` }],
                    mindMapData: mindMapData, timestamp: new Date()
                };
                setMessages(prev => [...prev, mindMapMessage]);
            } else {
                throw new Error('Invalid mind map data received from server');
            }
        } catch (err) {
            const errorMessageText = err.response?.data?.message || err.message || 'Failed to generate mind map.';
            setError(`Mind Map Error: ${errorMessageText}`);
            setMessages(prev => [...prev, { role: 'assistant', parts: [{ text: `❌ Mind Map Error: ${errorMessageText}` }], timestamp: new Date() }]);
        } finally {
            setLoadingStates(prev => ({ ...prev, mindMap: false }));
        }
    }, [isProcessing]);

    const handlePromptSelectChange = useCallback((newId) => {
        setCurrentSystemPromptId(newId);
        setEditableSystemPromptText(getPromptTextById(newId));
    }, []);
    
    const handlePromptTextChange = useCallback((newText) => {
        setEditableSystemPromptText(newText);
        const matchingPreset = availablePrompts.find(p => p.id !== 'custom' && p.prompt === newText);
        setCurrentSystemPromptId(matchingPreset ? matchingPreset.id : 'custom');
    }, []);

<<<<<<< HEAD
    const handleLoadSession = useCallback((sessionData) => {
        if (sessionData?.messages) {
            setMessages(sessionData.messages);
            setEditableSystemPromptText(sessionData.systemPrompt || getPromptTextById('friendly'));
            if (sessionData.sessionId) {
                setSessionId(sessionData.sessionId);
                localStorage.setItem('sessionId', sessionData.sessionId);
            }
        }
    }, []);

    const handleEnterKey = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

=======
>>>>>>> upstream/main
    if (!userId) {
        return <div className="loading-indicator"><span>Initializing...</span></div>;
    }
    
    return (
        <div className="chat-page-container">
<<<<<<< HEAD
<<<<<<< HEAD
            {/* Hamburger icon for mobile */}
            <button
                className="mobile-hamburger"
                onClick={() => setIsDrawerOpen(true)}
                aria-label="Open menu"
                style={{ display: 'none' }}
            >
                <FaBars size={24} />
            </button>
            {/* Sidebar for desktop, Drawer for mobile */}
            <div className={`sidebar-area${isDrawerOpen ? ' mobile-drawer-open' : ''}`}>
                {/* Drawer close button for mobile */}
                <button
                    className="mobile-drawer-close"
                    onClick={() => setIsDrawerOpen(false)}
                    aria-label="Close menu"
                    style={{ display: 'none' }}
                >
                    ✕
                </button>
                <SystemPromptWidget selectedPromptId={currentSystemPromptId} promptText={editableSystemPromptText} onSelectChange={handlePromptSelectChange} onTextChange={handlePromptTextChange} />
=======
            <div className={`sidebar-area${isDrawerOpen ? ' mobile-drawer-open' : ''}`}>
                <SystemPromptWidget 
                    selectedPromptId={currentSystemPromptId} 
                    promptText={editableSystemPromptText} 
                    onSelectChange={handlePromptSelectChange} 
                    onTextChange={handlePromptTextChange}
                />
>>>>>>> upstream/main
                <FileUploadWidget onUploadSuccess={fetchFiles} />
                <FileManagerWidget
                    files={files}
                    isLoading={loadingStates.files}
                    error={fileError}
                    onDeleteFile={handleDeleteFile}
                    onRenameFile={handleRenameFile}
                    onGeneratePodcast={handleGeneratePodcast}
                    onGenerateMindMap={handleGenerateMindMap}
                    onChatWithFile={handleChatWithFile}
                    isProcessing={isProcessing}
                />
<<<<<<< HEAD
                {/* Tools button with popover (mobile only) */}
                <Popover
                    isOpen={isToolsPopoverOpen}
                    positions={["bottom", "top"]}
                    align="center"
                    padding={10}
                    onClickOutside={() => setIsToolsPopoverOpen(false)}
                    content={
                        <div className="popover-menu">
                            <button className="popover-menu-item"><FaTools /> Tool 1</button>
                            <button className="popover-menu-item"><FaTools /> Tool 2</button>
                        </div>
                    }
                >
                    <button
                        className="tools-btn"
                        onClick={() => setIsToolsPopoverOpen((v) => !v)}
                        style={{ display: 'none' }}
                    >
                        <FaTools /> Tools
                    </button>
                </Popover>
            </div>
            {/* FAB for file upload (mobile only) */}
            <button
                className="mobile-fab"
                onClick={() => {
                    // Scroll to or open upload section
                    if (isDrawerOpen) return;
                    setIsDrawerOpen(true);
                }}
                aria-label="Upload file"
                style={{ display: 'none' }}
            >
                <FaPlus size={28} />
            </button>
            {/* Overlay for drawer (mobile only) */}
            {isDrawerOpen && <div className="mobile-drawer-overlay" onClick={() => setIsDrawerOpen(false)}></div>}
            <div className="chat-container">
                <header className="chat-header">
                    {/* Hamburger icon for mobile (visible only on mobile) */}
                    <button
                        className="mobile-hamburger"
                        onClick={() => setIsDrawerOpen(true)}
                        aria-label="Open menu"
                        style={{ display: 'none' }}
                    >
                        <FaBars size={24} />
                    </button>
                    <h1>Engineering Tutor</h1>
                    <div className="header-controls">
                        <span className="username-display">Hi, {username}!</span>
                        <button onClick={() => setShowHistoryModal(true)} className="header-button" disabled={isProcessing}>History</button>
                        <button onClick={handleNewChat} className="header-button" disabled={isProcessing}>New Chat</button>
                        <button onClick={() => handleLogout(false)} className="header-button" disabled={isProcessing}>Logout</button>
                    </div>
                </header>
=======
            </div>
            <div className="chat-container">
                <header className="chat-header">
                        <h1>Engineering Tutor</h1>
                        <div className="header-controls">
                            <span className="username-display">Hi, {username}!</span>
                            <button onClick={() => setShowHistoryModal(true)} className="header-button" disabled={isProcessing}>History</button>
                            <button onClick={handleNewChat} className="header-button" disabled={isProcessing}>New Chat</button>
                            <button onClick={() => handleLogout(false)} className="header-button" disabled={isProcessing}>Logout</button>
                        </div>
                    </header>
>>>>>>> upstream/main
                <div className="messages-area">
                    {messages.map((msg, index) => {
                        if (!msg?.role || !msg?.parts?.length) return null;
                        const messageText = msg.parts[0]?.text || '';
                        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
<<<<<<< HEAD
                        
                        return (
                            <div key={index} className={`message-wrapper ${msg.role}`}>
                                <div className={`message-content ${msg.type || ''}`}>
                                    {/* Main message body */}
                                    {msg.type === 'mindmap' && msg.mindMapData ? (
                                        <div id={`mindmap-container-${index}`} className="mindmap-container">
=======
                        return (
                            <div key={index} className={`message-wrapper ${msg.role}`}>
                                <div className={`message-content ${msg.type || ''}`}>
                                    {msg.type === 'mindmap' && msg.mindMapData ? (
                                        <div className="mindmap-container">
>>>>>>> upstream/main
                                            <MindMap mindMapData={msg.mindMapData} />
                                        </div>
                                    ) : msg.type === 'audio' && msg.audioUrl ? (
                                        <div className="audio-player-container">
                                            <p>{messageText}</p>
                                            <audio controls src={msg.audioUrl} />
                                        </div>
                                    ) : (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{messageText}</ReactMarkdown>
                                    )}
<<<<<<< HEAD

                                    {/* Footer with timestamp and TTS button */}
=======
>>>>>>> upstream/main
                                    <div className="message-footer">
                                        {msg.role === 'assistant' && (
                                            <button
                                                onClick={() => handleTextToSpeech(messageText, index)}
                                                className={`tts-button ${currentlySpeakingIndex === index ? 'speaking' : ''}`}
                                                title="Read aloud"
                                                disabled={isProcessing}
                                            >
<<<<<<< HEAD
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
                                                    <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>
                                                    <path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
                                                </svg>
=======
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/><path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/><path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/></svg>
>>>>>>> upstream/main
                                            </button>
                                        )}
                                        <span className="message-timestamp">{timestamp}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
<<<<<<< HEAD
                {/* Modern input bar for desktop */}
                <div className="modern-input-bar">
                  <div className="input-bar-left">
                    <button type="button" className="input-action-btn" title="Upload file" onClick={() => setIsDrawerOpen(true)} disabled={isProcessing}><FaPlus /></button>
                    <button type="button" className={`input-action-btn${isDeepSearchEnabled ? ' active' : ''}`} title="Deep Research" onClick={() => { setIsDeepSearchEnabled((v) => { if (!v) setIsRagEnabled(false); return !v; }); }} disabled={isProcessing}>DS</button>
                    <button type="button" className={`input-action-btn${isRagEnabled ? ' active' : ''}`} title="RAG" onClick={() => { setIsRagEnabled((v) => { if (!v) setIsDeepSearchEnabled(false); return !v; }); }} disabled={isProcessing}>RAG</button>
                  </div>
                  <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleEnterKey} placeholder="Type your message, or use the mic..." className="modern-input" disabled={isProcessing} autoComplete="off" style={{ flex: 1 }} />
                  <div className="input-bar-right">
                    <button type="button" className="input-action-btn" title="Use microphone" onClick={handleMicButtonClick} disabled={isProcessing}><FaMicrophone /></button>
                    <button type="submit" className="input-action-btn" title="Send message" disabled={isProcessing || !inputText.trim()} onClick={handleSendMessage}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94l18-9a.75.75 0 0 0 0-1.88l-18-9Z"/></svg>
                    </button>
                  </div>
=======
                <div className="modern-input-bar">
                    <div className="input-bar-left">
                        <button type="button" className="input-action-btn" title="Upload file" onClick={() => setIsDrawerOpen(true)} disabled={isProcessing}><FaPlus /></button>
                        <button type="button" className={`input-action-btn${isDeepSearchEnabled ? ' active' : ''}`} title="Deep Research" onClick={() => { setIsDeepSearchEnabled(v => !v); setIsRagEnabled(false); }} disabled={isProcessing}>DS</button>
                        <button type="button" className={`input-action-btn${isRagEnabled ? ' active' : ''}`} title="Chat with your documents" onClick={() => { setIsRagEnabled(v => !v); setIsDeepSearchEnabled(false); }} disabled={isProcessing}>RAG</button>
                        {/* The checkbox for enabling Deep Search within RAG has been removed. */}
=======
            {isSidebarExpanded && <div className="drawer-overlay" onClick={() => setIsSidebarExpanded(false)} />}
            
            <div className={`sidebar-area ${isSidebarExpanded ? 'expanded' : 'collapsed'}`}>
                <div className="sidebar-icons">
                    <div className="sidebar-icons-top">
                        <button onClick={() => setIsSidebarExpanded(p => !p)} className="icon-button" title="Toggle Menu"> <FaBars /> </button>
                        <button onClick={handleNewChat} className="icon-button" disabled={isProcessing} title="New Chat"> <FaPlus /> </button>
                        <button onClick={() => setSidebarView('history')} className={`icon-button ${sidebarView === 'history' ? 'active' : ''}`} disabled={isProcessing} title="Chat History"> <FaHistory /> </button>
                        <button onClick={() => setSidebarView('files')} className={`icon-button ${sidebarView === 'files' ? 'active' : ''}`} title="My Files"> <FaFolderOpen /> </button>
>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd
                    </div>
                    <div className="sidebar-icons-bottom">
                         <button onClick={() => setSidebarView('settings')} className={`icon-button ${sidebarView === 'settings' ? 'active' : ''}`} title="Settings"> <FaCog /> </button>
                    </div>
                </div>
                <div className="sidebar-content">
                    <div className="mobile-sidebar-nav">
                        <button onClick={() => { handleNewChat(); setIsSidebarExpanded(false); }} className="mobile-nav-button" disabled={isProcessing}>
                            <FaPlus /> New Chat
                        </button>
                        <button onClick={() => setSidebarView('history')} className={`mobile-nav-button ${sidebarView === 'history' ? 'active' : ''}`} disabled={isProcessing}>
                            <FaHistory /> Chat History
                        </button>
                        <button onClick={() => setSidebarView('files')} className={`mobile-nav-button ${sidebarView === 'files' ? 'active' : ''}`}>
                            <FaFolderOpen /> My Files
                        </button>
                        <button onClick={() => setSidebarView('settings')} className={`mobile-nav-button ${sidebarView === 'settings' ? 'active' : ''}`}>
                            <FaCog /> Settings
                        </button>
                    </div>
<<<<<<< HEAD
>>>>>>> upstream/main
=======
                    <div className="sidebar-divider" />

                    {sidebarView === 'files' && (
                        <>
                            <FileUploadWidget onUploadSuccess={fetchFiles} />
                            <FileManagerWidget
                                files={files}
                                isLoading={loadingStates.files}
                                error={fileError}
                                onDeleteFile={handleDeleteFile}
                                onRenameFile={handleRenameFile}
                                onGeneratePodcast={handleGeneratePodcast}
                                onGenerateMindMap={handleGenerateMindMap}
                                onChatWithFile={handleChatWithFile}
                                isProcessing={isProcessing}
                                onActionTaken={handleSidebarAction}
                            />
                        </>
                    )}
                    {sidebarView === 'history' && (
                        <HistorySidebarWidget onLoadSession={handleLoadSession} />
                    )}
                    {sidebarView === 'settings' && (
                        <SettingsWidget 
                           selectedPromptId={currentSystemPromptId}
                           promptText={editableSystemPromptText}
                           onSelectChange={handlePromptSelectChange}
                           onTextChange={handlePromptTextChange}
                        />
                    )}
>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd
                </div>
            </div>
    
            <div className="chat-container">
                <header className="chat-header">
                    <div className="header-left">
                        <button onClick={() => setIsSidebarExpanded(p => !p)} className="header-button hamburger-button-mobile" title="Toggle Menu">
                            <FaBars />
                        </button>
                        <h1>TutorAI</h1>
                    </div>
                    <div className="header-right">
                        <MuiIconButton onClick={handleProfileClick} title="Profile">
                            <div className="avatar profile-avatar">{username?.[0]?.toUpperCase()}</div>
                        </MuiIconButton>
                        <Popover
                            open={isProfileOpen}
                            anchorEl={profileAnchorEl}
                            onClose={handleProfileClose}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                            <Box sx={{ p: 2, minWidth: '240px', backgroundColor: '#2d2d2d', color: '#fff', border: '1px solid #444', borderRadius: '8px' }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Signed in as
                                </Typography>
                                <Typography variant="body1" color="text.primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    {username}
                                </Typography>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="error"
                                    startIcon={<FaSignOutAlt />}
                                    sx={{ 
                                        textTransform: 'none', 
                                        backgroundColor: '#B00020', 
                                        '&:hover': { backgroundColor: '#D50000' } 
                                    }}
                                    onClick={() => handleLogout(false)}
                                >
                                    Logout
                                </Button>
                            </Box>
                        </Popover>
                    </div>
                </header>
    
                <main className="messages-area">
                    {messages.length === 0 && !isProcessing && (
                        <div className="welcome-message">
                            <GeminiIcon />
                            <h2>How can I help you today?</h2>
                        </div>
                    )}
                    {messages.map((msg, index) => {
                         if (!msg?.role || !msg?.parts?.length) return null;
                         const messageText = msg.parts[0]?.text || '';
                         return (
                             <div key={index} className={`message-row ${msg.role}`}>
                                 <div className="avatar">
                                     {msg.role === 'user' ? (username?.[0]?.toUpperCase() || 'U') : <GeminiIcon />}
                                 </div>
                                 <div className="message-bubble-container">
                                     <div className={`message-bubble ${msg.type || ''}`}>
                                         {msg.type === 'mindmap' && msg.mindMapData ? (
                                             <div className="mindmap-container">
                                                 <MindMap mindMapData={msg.mindMapData} />
                                             </div>
                                         ) : msg.type === 'audio' && msg.audioUrl ? (
                                             <div className="audio-player-container">
                                                 <p>{messageText}</p>
                                                 <audio controls src={msg.audioUrl} />
                                             </div>
                                         ) : (
                                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{messageText}</ReactMarkdown>
                                         )}
                                     </div>
                                     <div className="message-actions">
                                         {msg.role === 'assistant' && (
                                             <button
                                                 onClick={() => handleTextToSpeech(messageText, index)}
                                                 className={`tts-button ${currentlySpeakingIndex === index ? 'speaking' : ''}`}
                                                 title="Read aloud"
                                                 disabled={isProcessing}
                                             >
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/><path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/><path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/></svg>
                                             </button>
                                         )}
                                     </div>
                                 </div>
                             </div>
                         );
                    })}
                    <div ref={messagesEndRef} />
                </main>
    
                <footer className="chat-footer">
                    <div className="input-area-container">
                        <form className="modern-input-bar" onSubmit={handleSendMessage}>
                            <button
                                type="button"
                                className={`input-action-btn ${isDeepSearchEnabled ? 'active' : ''}`}
                                title="Deep Research"
                                onClick={() => { setIsDeepSearchEnabled(v => !v); setIsRagEnabled(false); }}
                                disabled={isProcessing}
                            >
                                DS
                            </button>
                            <button
                                type="button"
                                className={`input-action-btn ${isRagEnabled ? 'active' : ''}`}
                                title="Chat with your documents"
                                onClick={() => { setIsRagEnabled(v => !v); setIsDeepSearchEnabled(false); }}
                                disabled={isProcessing || !files.length}
                            >
                                RAG
                            </button>
                            <textarea
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                onKeyDown={handleEnterKey}
                                placeholder="Enter a prompt here"
                                className="modern-input"
                                disabled={isProcessing}
                                rows="1"
                            />
                            <button
                                type="button"
                                className="input-action-btn mic-button"
                                title="Use microphone"
                                onClick={handleMicButtonClick}
                                disabled={isProcessing}
                            >
                                <FaMicrophone />
                            </button>
                            <button
                                type="submit"
                                className="input-action-btn send-button"
                                title="Send message"
                                disabled={isProcessing || !inputText.trim()}
                            >
                                <FaPaperPlane />
                            </button>
                        </form>
                        {error && <p className="error-message">{error}</p>}
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ChatPage;

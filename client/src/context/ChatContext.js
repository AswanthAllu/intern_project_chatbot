// client/src/context/ChatContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [sessionId, setSessionId] = useState(() => localStorage.getItem('sessionId') || uuidv4());

    const addMessage = useCallback((message) => {
        // Ensure message has a timestamp and unique key for rendering
        const messageWithMeta = {
            ...message,
            timestamp: new Date().toISOString(),
            key: uuidv4()
        };
        setMessages(prev => [...prev, messageWithMeta]);
    }, []);

    const resetChat = useCallback(() => {
        setMessages([]);
        const newSessionId = uuidv4();
        setSessionId(newSessionId);
        localStorage.setItem('sessionId', newSessionId);
    }, []);

    const loadSession = useCallback((sessionData) => {
        if (sessionData && sessionData.sessionId && sessionData.messages) {
            setSessionId(sessionData.sessionId);
            localStorage.setItem('sessionId', sessionData.sessionId);
            // Add unique keys to loaded messages for stable rendering
            const messagesWithKeys = sessionData.messages.map(m => ({...m, key: uuidv4()}));
            setMessages(messagesWithKeys);
        }
    }, []);

    const value = {
        messages,
        sessionId,
        addMessage,
        resetChat,
        loadSession,
        setMessages // Expose setMessages for direct manipulation if needed
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
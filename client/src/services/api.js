<<<<<<< HEAD
import axios from 'axios';

const getApiBaseUrl = () => {
    const backendPort = process.env.REACT_APP_BACKEND_PORT || 5005;
=======
// src/services/api.js
import axios from 'axios';

const getApiBaseUrl = () => {
    const backendPort = process.env.REACT_APP_BACKEND_PORT || 5007;
>>>>>>> upstream/main
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    // For development, ensure it correctly points to your backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//${hostname}:${backendPort}/api`;
    }
    // For production, it might just be /api if served from the same domain
    return '/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log("API Base URL:", API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use(
    (config) => {
<<<<<<< HEAD
        // Add the auth token to every request
=======
>>>>>>> upstream/main
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
<<<<<<< HEAD
        // Add user ID for specific routes that might need it (optional, can be derived from token on backend)
        const userId = localStorage.getItem('userId');
        if (userId) {
            config.headers['x-user-id'] = userId;
            console.log('API Interceptor: Adding x-user-id header:', userId);
        } else {
            console.warn('API Interceptor: No userId found in localStorage');
        }
        
        console.log('API Interceptor: Request headers:', config.headers);
        
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        } else if (!config.headers['Content-Type']) {
             config.headers['Content-Type'] = 'application/json';
=======
        const userId = localStorage.getItem('userId');
        if (userId) {
            config.headers['x-user-id'] = userId;
        }
        if (config.data instanceof FormData) {
            // Let the browser set the Content-Type for FormData
            delete config.headers['Content-Type'];
        } else if (!config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
>>>>>>> upstream/main
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.clear();
            // Use a query parameter to show a message on the login page
            window.location.href = '/login?sessionExpired=true';
        }
        return Promise.reject(error);
    }
);

// Auth
export const signupUser = (userData) => api.post('/auth/signup', userData);
export const signinUser = (userData) => api.post('/auth/signin', userData);
export const getCurrentUser = () => api.get('/auth/me');

// Chat
export const sendMessage = (messageData) => api.post('/chat/message', messageData);
export const saveChatHistory = (historyData) => api.post('/chat/history', historyData);
export const getChatSessions = () => api.get('/chat/sessions');
export const getSessionDetails = (sessionId) => api.get(`/chat/session/${sessionId}`);
<<<<<<< HEAD
=======
export const deleteChatSession = (sessionId) => api.delete(`/chat/session/${sessionId}`);
<<<<<<< HEAD
>>>>>>> upstream/main
=======

// RAG and Search
export const queryRagService = (queryData) => api.post('/chat/rag', queryData);
export const performDeepSearch = (query, history = []) => api.post('/chat/deep-search', { query, history });
export const queryHybridRagService = (queryData) => api.post('/chat/rag-v2', queryData);

// Files
>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd
export const uploadFile = (formData) => api.post('/upload', formData);
export const getUserFiles = () => api.get('/files');
export const deleteUserFile = (fileId) => api.delete(`/files/${fileId}`);
export const renameUserFile = (fileId, newOriginalName) => api.patch(`/files/${fileId}`, { newOriginalName });

// Content Generation
export const generatePodcast = (fileId) => api.post('/podcast/generate', { fileId });
export const generateMindMap = (fileId) => api.post('/mindmap/generate', { fileId });
<<<<<<< HEAD
export const performDeepSearch = (query, history = []) => api.post('/chat/deep-search', { query, history });
<<<<<<< HEAD

// --- FIX: Removed the duplicate declaration ---
export const renameUserFile = (fileId, newOriginalName) => api.patch(`/files/${fileId}`, { newOriginalName });

export const getCurrentUser = () => api.get('/auth/me'); 
=======
export const renameUserFile = (fileId, newOriginalName) => api.patch(`/files/${fileId}`, { newOriginalName });
export const getCurrentUser = () => api.get('/auth/me');

// NEW FUNCTION FOR HYBRID RAG
export const queryHybridRagService = (queryData) => api.post('/chat/rag-v2', queryData);
>>>>>>> upstream/main
=======
>>>>>>> a23a90a7b862494862611e06c52c6a72a196babd

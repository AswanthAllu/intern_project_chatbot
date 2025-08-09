import axios from 'axios';

const getApiBaseUrl = () => {
    const backendPort = process.env.REACT_APP_BACKEND_PORT || 5005;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:${backendPort}/api`;
};

const API_BASE_URL = getApiBaseUrl();
console.log("API Base URL:", API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        const userId = localStorage.getItem('userId');
        if (userId) {
            config.headers['x-user-id'] = userId;
        }

        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        } else if (!config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
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
            window.location.href = '/login?sessionExpired=true';
        }
        return Promise.reject(error);
    }
);

export const signupUser = (userData) => api.post('/auth/signup', userData);
export const signinUser = (userData) => api.post('/auth/signin', userData);
// Updated to send a more structured history
export const sendMessage = (messageData) => api.post('/chat/message', messageData);
export const saveChatHistory = (historyData) => api.post('/chat/history', historyData);
export const queryRagService = (queryData) => api.post('/chat/rag', queryData);
export const getChatSessions = () => api.get('/chat/sessions');
export const getSessionDetails = (sessionId) => api.get(`/chat/session/${sessionId}`);
export const uploadFile = (formData) => api.post('/upload', formData);
export const getUserFiles = () => api.get('/files');
export const deleteUserFile = (fileId) => api.delete(`/files/${fileId}`);
export const generatePodcast = (fileId, style = 'single-host') => api.post('/podcast/generate', { fileId, style });
export const generateMindMap = (fileId) => api.post('/mindmap/generate', { fileId });
export const generatePPT = (topic) => api.post('/files/generate-ppt', { topic }, { responseType: 'blob' });
export const generateReport = (topic) => api.post('/files/generate-report', { topic }, { responseType: 'blob' });
export const performDeepSearch = (query, history = []) => api.post('/chat/deep-search', { query, history });
export const renameUserFile = (fileId, newOriginalName) => api.patch(`/files/${fileId}`, { newOriginalName });
export const getFileOverview = (fileId) => api.post('/files/overview', { fileId });

// --- Merged Functions ---

// User Memory Management (from main)
export const getMemories = () => api.get('/memory');
export const addMemory = (memoryData) => api.post('/memory', memoryData);
export const deleteMemory = (memoryId) => api.delete(`/memory/${memoryId}`);

// Quota Management (from main)
export const getQuotaStatus = () => api.get('/chat/quota-status');

// User Details (from team4)
export const getCurrentUser = () => api.get('/auth/me');

// Training functions
export const getBaseModels = (includeCustom = false, includeOllama = false) => api.get(`/training/base-models?includeCustom=${includeCustom}&includeOllama=${includeOllama}`);
export const getCheckpoints = (subject = null) => api.get(`/training/checkpoints${subject ? `?subject=${subject}` : ''}`);
export const getCustomModels = () => api.get('/training/models/custom');
export const deleteCustomModel = (modelId) => api.delete(`/training/models/custom/${modelId}`);
export const uploadCustomModel = (formData) => api.post('/training/models/custom', formData, {
    headers: {
        'Content-Type': 'multipart/form-data'
    }
});

// Training data functions
export const getTrainingDataStats = (subject) => api.get(`/training/data/stats/${subject}`);
export const uploadTrainingData = (formData) => api.post('/training/data/upload', formData, {
    headers: {
        'Content-Type': 'multipart/form-data'
    }
});
export const addTextTrainingData = (data) => api.post('/training/data/text', data);

// Database functions
export const getSupportedDatabaseTypes = () => api.get('/training/database/supported-types');
export const getDataFormats = () => api.get('/training/database/data-formats');
export const testDatabaseConnection = (config) => api.post('/training/database/test-connection', { config });
export const getDatabaseSchema = (config) => api.post('/training/database/get-schema', { config });
export const extractTrainingData = (config, extractionConfig) => api.post('/training/database/extract-data', { config, extractionConfig });
export const validateTrainingData = (data, format, options) => api.post('/training/database/validate-data', { data, format, options });

// Chat session functions
export const deleteChatSession = (sessionId) => api.delete(`/chat/sessions/${sessionId}`);

// Ollama functions (Training Dashboard)
export const getOllamaStatus = () => api.get('/training/ollama/status');
export const configureOllama = (baseUrl) => api.post('/training/ollama/configure', { baseUrl });
export const getOllamaModels = () => api.get('/training/ollama/models');
export const getPopularOllamaModels = () => api.get('/training/ollama/popular');
export const getRunningOllamaModels = () => api.get('/training/ollama/running');
export const deleteOllamaModel = (modelName) => api.delete(`/training/ollama/models/${modelName}`);
export const loadOllamaModel = (modelName) => api.post(`/training/ollama/load/${modelName}`);
export const unloadOllamaModel = (modelName) => api.post(`/training/ollama/unload/${modelName}`);

// Training dashboard functions
export const getTrainingModels = () => api.get('/training/models');
export const getTrainedModels = () => api.get('/training/models'); // Alias for consistency
export const getTrainingStatus = () => api.get('/training/status');
export const startTrainingAPI = (data) => api.post('/training/start', data);
export const stopTrainingAPI = () => api.post('/training/stop');
export const getTrainingProgress = () => api.get('/training/progress');

// Model download function
export const downloadTrainedModel = async (modelId) => {
    const response = await api.get(`/training/download/${modelId}`, {
        responseType: 'blob',
        headers: {
            'X-User-ID': localStorage.getItem('userId') || 'anonymous'
        }
    });
    return response;
};

// Get trained models for chat
export const getTrainedModelsForChat = () => api.get('/training/models/chat');

// Sample data generation
export const generateSampleData = (subject, count) => api.post('/training/data/generate', { subject, count });

// Ollama functions
export const pullOllamaModel = (modelName) => api.post('/ollama/pull', { modelName });

// User API Keys Management
export const getUserApiKeys = () => api.get('/user-api-keys');
export const updateUserApiKeys = (data) => api.put('/user-api-keys', data);
export const testUserServices = () => api.post('/user-api-keys/test');
export const requestAdminAccess = (data) => api.post('/user-api-keys/request-admin-access', data);

// Admin Dashboard
export const getAdminDashboard = () => api.get('/admin/dashboard');
export const getAllUsers = () => api.get('/admin/users');
export const getUserDetails = (userId) => api.get(`/admin/users/${userId}`);
export const approveAdminAccess = (userId, data) => api.post(`/admin/users/${userId}/approve`, data);
export const denyAdminAccess = (userId, data) => api.post(`/admin/users/${userId}/deny`, data);
export const revokeAdminAccess = (userId, data) => api.post(`/admin/users/${userId}/revoke`, data);
export const updateUserConfig = (userId, data) => api.put(`/admin/users/${userId}`, data);
export const getSystemStats = () => api.get('/admin/stats');

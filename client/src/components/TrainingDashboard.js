import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getTrainingModels,
    getTrainingStatus,
    getTrainingProgress,
    startTrainingAPI,
    stopTrainingAPI,
    getOllamaStatus
} from '../services/api';
import DataManager from './DataManager';
import AdvancedTrainingConfig from './AdvancedTrainingConfig';
import OllamaConfig from './OllamaConfig';
import './TrainingDashboard.css';

const TrainingDashboard = () => {
    const navigate = useNavigate();
    const [trainingStatus, setTrainingStatus] = useState('idle');
    const [selectedSubject, setSelectedSubject] = useState('mathematics');
    const [trainingConfig, setTrainingConfig] = useState({
        modelSize: '1B',
        epochs: 3,
        batchSize: 4,
        learningRate: 2e-4,
        useUnsloth: true,
        useLoRA: true,
        trainingMode: 'fine_tune',
        baseModel: null,
        checkpointId: null,
        resumeFromCheckpoint: false,
        transferFromSubject: null,
        retrainExisting: false
    });
    const [trainingLogs, setTrainingLogs] = useState([]);
    const [models, setModels] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    // const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
    // const [advancedConfig, setAdvancedConfig] = useState({});
    const [trainingData, setTrainingData] = useState(null);

    const [showOllamaConfig, setShowOllamaConfig] = useState(false);
    const [ollamaStatus, setOllamaStatus] = useState({ connected: false, baseUrl: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Foundational models removed - now handled in Advanced Training Configuration

    // Predefined subject suggestions
    const subjectSuggestions = [
        'Mathematics', 'Programming', 'Science', 'History', 'Literature',
        'Medicine', 'Law', 'Business', 'Art', 'Music', 'Philosophy', 'Psychology'
    ];

    const modelSizes = ['1B', '3B', '7B'];

    // Check authentication on component mount
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const storedUsername = localStorage.getItem('username');

        console.log('TrainingDashboard: Checking authentication...');
        console.log('TrainingDashboard: userId:', userId);
        console.log('TrainingDashboard: username:', storedUsername);

        if (userId && storedUsername) {
            setIsAuthenticated(true);
            setUsername(storedUsername);
            initializeDashboard();
        } else {
            // Try to get user info from other sources or allow demo mode
            const demoUsername = 'Demo User';
            console.warn('TrainingDashboard: User not authenticated, using demo mode');
            setIsAuthenticated(true);
            setUsername(demoUsername);
            initializeDashboard();
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchModels();
            fetchTrainingStatus();
            checkOllamaStatus();
        }
    }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

    const initializeDashboard = async () => {
        try {
            setLoading(true);
            setError(null);



            await Promise.all([
                fetchModels(),
                fetchTrainingStatus(),
                checkOllamaStatus()
            ]);
        } catch (err) {
            console.error('Error initializing dashboard:', err);
            setError('Failed to initialize dashboard. Some features may not work properly.');
        } finally {
            setLoading(false);
        }
    };



    const checkOllamaStatus = async () => {
        try {
            const response = await getOllamaStatus();
            console.log('Ollama status response:', response.data);
            setOllamaStatus({
                connected: response.data.connected,
                baseUrl: response.data.baseUrl
            });

            if (response.data.connected) {
                addLog(`Ollama connected: ${response.data.baseUrl}`);
            }
        } catch (error) {
            console.log('Ollama status check failed:', error);
            setOllamaStatus({ connected: false, baseUrl: '' });
        }
    };

    const fetchModels = async () => {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                console.warn('No user ID found in localStorage');
                setModels([]);
                return;
            }

            console.log('TrainingDashboard: Fetching models...');
            const response = await getTrainingModels();
            const fetchedModels = response.data.models || [];
            console.log('Fetched models:', fetchedModels);
            setModels(fetchedModels);
        } catch (error) {
            console.error('Error fetching models:', error);
            setModels([]);
            addLog('Error fetching models - please check backend server connection');
        }
    };

    // fetchFoundationalModels removed - now handled in Advanced Training Configuration



    const fetchTrainingStatus = async () => {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                console.warn('No user ID found in localStorage');
                return;
            }

            console.log('TrainingDashboard: Fetching training status...');
            const response = await getTrainingStatus();
            setTrainingStatus(response.data.status || 'idle');
        } catch (error) {
            console.error('Error fetching training status:', error);
            setTrainingStatus('idle');
        }
    };

    const startTraining = async () => {
        try {
            setTrainingStatus('starting');
            const response = await startTrainingAPI({ subject: selectedSubject, config: trainingConfig });

            if (response.data.success) {
                setTrainingStatus('training');
                addLog(`Started training ${selectedSubject} model with ${trainingConfig.modelSize} parameters`);
                pollTrainingProgress();
            } else {
                setTrainingStatus('error');
                addLog(`Error starting training: ${response.data.error}`);
            }
        } catch (error) {
            setTrainingStatus('error');
            addLog(`Error: ${error.message}`);
            console.error('Training start error:', error);
        }
    };

    const stopTraining = async () => {
        try {
            const response = await stopTrainingAPI();
            if (response.data.success) {
                setTrainingStatus('stopped');
                addLog('Training stopped by user');
            }
        } catch (error) {
            addLog(`Error stopping training: ${error.message}`);
            console.error('Training stop error:', error);
        }
    };

    const pollTrainingProgress = () => {
        const interval = setInterval(async () => {
            try {
                // We might need to pass a training ID here, but for now we'll call it without parameters
                // This might need to be updated based on how the backend API works
                const response = await getTrainingProgress();
                const data = response.data;

                if (data.logs) {
                    data.logs.forEach(log => addLog(log));
                }

                if (data.status === 'completed' || data.status === 'error') {
                    setTrainingStatus(data.status);
                    clearInterval(interval);
                    fetchModels(); // Refresh models list
                }
            } catch (error) {
                console.error('Error polling progress:', error);
            }
        }, 2000);

        return interval;
    };

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setTrainingLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    };

    const handleConfigChange = (key, value) => {
        setTrainingConfig(prev => ({
            ...prev,
            [key]: value
        }));
    };



    const handleOllamaConfigurationChange = (config) => {
        setOllamaStatus(config);
        if (config.connected) {
            addLog(`Ollama configured successfully: ${config.baseUrl}`);
        }
        // Refresh status after configuration change
        setTimeout(checkOllamaStatus, 1000);
    };

    const downloadModel = async (modelId) => {
        try {
            console.log('📥 Attempting to download model:', modelId);
            addLog(`Downloading model: ${modelId}...`);

            const headers = {
                'Content-Type': 'application/json',
                'X-User-ID': localStorage.getItem('userId') || '507f1f77bcf86cd799439011'
            };

            // Try both proxy and direct connection
            const downloadUrls = [
                `/api/training/download/${modelId}`, // Through proxy
                `http://localhost:5005/api/training/download/${modelId}` // Direct
            ];

            let response = null;
            let lastError = null;

            for (const downloadUrl of downloadUrls) {
                try {
                    console.log('🌐 Trying download URL:', downloadUrl);

                    response = await fetch(downloadUrl, {
                        method: 'GET',
                        headers: headers
                    });

                    console.log('📡 Download response status:', response.status);

                    if (response.ok) {
                        console.log(`✅ Download successful via ${downloadUrl}`);
                        break; // Success, exit loop
                    } else {
                        const errorText = await response.text();
                        console.error(`❌ Download failed via ${downloadUrl}:`, errorText);
                        lastError = new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                    }
                } catch (urlError) {
                    console.error(`❌ Error with ${downloadUrl}:`, urlError);
                    lastError = urlError;
                    response = null;
                }
            }

            if (!response || !response.ok) {
                throw lastError || new Error('All download attempts failed');
            }

            // Create download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `model_${modelId}.zip`;
            document.body.appendChild(a); // Add to DOM for Firefox compatibility
            a.click();
            document.body.removeChild(a); // Clean up
            window.URL.revokeObjectURL(url); // Free memory

            addLog(`✅ Model ${modelId} downloaded successfully`);
            alert(`Model "${modelId}" has been downloaded successfully!`);

        } catch (error) {
            console.error('❌ Download model error:', error);
            addLog(`❌ Error downloading model: ${error.message}`);
            alert(`Failed to download model: ${error.message}`);
        }
    };

    const deleteModel = async (modelId) => {
        console.log('🗑️ Attempting to delete model:', modelId);
        console.log('🔍 Current userId from localStorage:', localStorage.getItem('userId'));

        if (!window.confirm(`Are you sure you want to delete the model "${modelId}"? This action cannot be undone.`)) {
            console.log('❌ User cancelled deletion');
            return;
        }

        try {
            addLog(`Deleting model: ${modelId}...`);

            const headers = {
                'Content-Type': 'application/json',
                'X-User-ID': localStorage.getItem('userId') || '507f1f77bcf86cd799439011'
            };
            console.log('📋 Request headers:', headers);

            // Try both proxy and direct connection
            const deleteUrls = [
                `/api/training/models/${modelId}`, // Through proxy
                `http://localhost:5005/api/training/models/${modelId}` // Direct
            ];

            let response = null;
            let lastError = null;

            for (const deleteUrl of deleteUrls) {
                try {
                    console.log('🌐 Trying delete URL:', deleteUrl);

                    response = await fetch(deleteUrl, {
                        method: 'DELETE',
                        headers: headers
                    });

                    console.log('📡 Delete response status:', response.status);

                    if (response.ok) {
                        console.log(`✅ Delete successful via ${deleteUrl}`);
                        break; // Success, exit loop
                    } else {
                        const errorText = await response.text();
                        console.error(`❌ Delete failed via ${deleteUrl}:`, errorText);
                        lastError = new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                    }
                } catch (urlError) {
                    console.error(`❌ Error with ${deleteUrl}:`, urlError);
                    lastError = urlError;
                    response = null;
                }
            }

            if (!response || !response.ok) {
                throw lastError || new Error('All delete attempts failed');
            }

            console.log('📡 Delete response status:', response.status);
            console.log('📡 Delete response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Delete error response:', errorText);

                // Check if it's a proxy error
                if (errorText.includes('Proxy error') || errorText.includes('ECONNREFUSED')) {
                    throw new Error(`Backend server not available. Please ensure the server is running on port 5005.`);
                }

                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            let result;
            try {
                result = await response.json();
                console.log('✅ Delete result:', result);
            } catch (jsonError) {
                console.error('❌ Failed to parse JSON response:', jsonError);
                const responseText = await response.text();
                console.error('❌ Raw response:', responseText);
                throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 100)}...`);
            }

            if (result.success) {
                addLog(`✅ Model ${modelId} deleted successfully`);
                console.log('🔄 Refreshing models list...');
                await fetchModels(); // Refresh the models list
                alert(`Model "${modelId}" has been deleted successfully!`);
            } else {
                throw new Error(result.error || 'Failed to delete model');
            }
        } catch (error) {
            console.error('❌ Delete model error:', error);
            addLog(`❌ Error deleting model: ${error.message}`);
            alert(`Failed to delete model: ${error.message}`);
        }
    };



    // Show loading state
    if (loading) {
        return (
            <div className="training-dashboard">
                <div className="dashboard-header">
                    <div className="header-nav">
                        <button
                            onClick={() => navigate('/chat')}
                            className="back-button"
                            title="Back to Chat"
                        >
                            ← Back to Chat
                        </button>
                    </div>
                    <h1>🧠 LLM Training Dashboard</h1>
                    <div className="auth-prompt">
                        <h2>Loading Dashboard...</h2>
                        <p>Please wait while we initialize the training environment.</p>
                        <div className="loading-spinner">🔄</div>
                    </div>
                </div>
            </div>
        );
    }

    // Show login prompt if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="training-dashboard">
                <div className="dashboard-header">
                    <div className="header-nav">
                        <button
                            onClick={() => navigate('/chat')}
                            className="back-button"
                            title="Back to Chat"
                        >
                            ← Back to Chat
                        </button>
                    </div>
                    <h1>🧠 LLM Training Dashboard</h1>
                    <div className="auth-prompt">
                        <h2>Authentication Required</h2>
                        <p>Please log in to access the LLM Training Dashboard.</p>
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/chat')}
                        >
                            Go to Chat & Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="training-dashboard">
            <div className="dashboard-header">
                <div className="header-nav">
                    <button
                        onClick={() => navigate('/chat')}
                        className="back-button"
                        title="Back to Chat"
                    >
                        ← Back to Chat
                    </button>
                </div>
                <h1>🧠 LLM Training Dashboard</h1>
                <p>Welcome, {username}! Train specialized subject-specific language models</p>


            </div>

            <div className="dashboard-grid">
                {/* Data Management */}
                <DataManager
                    selectedSubject={selectedSubject}
                    onDataUpdate={fetchModels}
                />



                {/* Ollama Configuration */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h3>🦙 Ollama Configuration</h3>
                        <div className="header-actions">
                            <button
                                className="refresh-btn"
                                onClick={checkOllamaStatus}
                                title="Refresh Ollama Status"
                            >
                                🔄
                            </button>
                            <button
                                className="config-btn"
                                onClick={() => setShowOllamaConfig(!showOllamaConfig)}
                            >
                                {showOllamaConfig ? 'Hide' : 'Configure'}
                            </button>
                        </div>
                    </div>

                    {ollamaStatus.connected && (
                        <div className="database-summary">
                            <div className="summary-item">
                                <strong>Status:</strong> Connected
                            </div>
                            <div className="summary-item">
                                <strong>URL:</strong> {ollamaStatus.baseUrl}
                            </div>
                        </div>
                    )}

                    {!ollamaStatus.connected && (
                        <div className="database-summary">
                            <div className="summary-item error">
                                <strong>Status:</strong> Not connected - Configure Ollama to use local models
                            </div>
                        </div>
                    )}

                    {showOllamaConfig && (
                        <OllamaConfig
                            onConfigurationChange={handleOllamaConfigurationChange}
                        />
                    )}
                </div>

                {/* Training Section */}
                <div className="training-section">
                    {/* Training Configuration */}
                    <div className="config-panel">
                    <h2>Training Configuration</h2>
                    
                    <div className="form-group">
                        <label>Custom Subject Domain</label>
                        <input
                            type="text"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            placeholder="Enter your subject domain (e.g., Mathematics, Programming, Medicine...)"
                            disabled={trainingStatus === 'training'}
                            className="subject-input"
                        />
                        <div className="subject-suggestions">
                            <small>Suggestions: </small>
                            {subjectSuggestions.map(suggestion => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    className="suggestion-btn"
                                    onClick={() => setSelectedSubject(suggestion.toLowerCase())}
                                    disabled={trainingStatus === 'training'}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Foundation Model selection moved to Advanced Training Configuration */}
                    <div className="info-card">
                        <div className="info-icon">💡</div>
                        <div className="info-content">
                            <strong>Model Selection</strong>
                            <p>Use the <strong>Advanced Training Configuration</strong> below to select foundation models, custom models, or Ollama models for training.</p>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Model Size</label>
                        <select
                            value={trainingConfig.modelSize}
                            onChange={(e) => handleConfigChange('modelSize', e.target.value)}
                            disabled={trainingStatus === 'training'}
                        >
                            {modelSizes.map(size => (
                                <option key={size} value={size}>{size} Parameters</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Epochs</label>
                            <input 
                                type="number" 
                                value={trainingConfig.epochs}
                                onChange={(e) => handleConfigChange('epochs', parseInt(e.target.value))}
                                min="1" max="10"
                                disabled={trainingStatus === 'training'}
                            />
                        </div>
                        <div className="form-group">
                            <label>Batch Size</label>
                            <input 
                                type="number" 
                                value={trainingConfig.batchSize}
                                onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value))}
                                min="1" max="16"
                                disabled={trainingStatus === 'training'}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Learning Rate</label>
                        <input 
                            type="number" 
                            step="0.0001"
                            value={trainingConfig.learningRate}
                            onChange={(e) => handleConfigChange('learningRate', parseFloat(e.target.value))}
                            disabled={trainingStatus === 'training'}
                        />
                    </div>

                    <div className="checkbox-group">
                        <label>
                            <input 
                                type="checkbox" 
                                checked={trainingConfig.useUnsloth}
                                onChange={(e) => handleConfigChange('useUnsloth', e.target.checked)}
                                disabled={trainingStatus === 'training'}
                            />
                            Use Unsloth (Memory Efficient)
                        </label>
                        <label>
                            <input 
                                type="checkbox" 
                                checked={trainingConfig.useLoRA}
                                onChange={(e) => handleConfigChange('useLoRA', e.target.checked)}
                                disabled={trainingStatus === 'training'}
                            />
                            Use LoRA (Low-Rank Adaptation)
                        </label>
                    </div>

                    {/* Advanced Training Configuration */}
                    <AdvancedTrainingConfig
                        subject={selectedSubject}
                        config={trainingConfig}
                        onConfigChange={setTrainingConfig}
                        availableSubjects={subjectSuggestions.map(s => s.toLowerCase())}
                    />

                    <div className="training-controls">
                        {trainingStatus === 'idle' || trainingStatus === 'completed' || trainingStatus === 'error' ? (
                            <button className="btn-primary" onClick={startTraining}>
                                🚀 Start Training
                            </button>
                        ) : (
                            <button className="btn-danger" onClick={stopTraining}>
                                ⏹️ Stop Training
                            </button>
                        )}
                    </div>
                </div>

                    {/* Training Status */}
                    <div className="status-panel">
                    <h2>Training Status</h2>
                    <div className={`status-indicator ${trainingStatus}`}>
                        <div className="status-icon">
                            {trainingStatus === 'idle' && '⏸️'}
                            {trainingStatus === 'starting' && '🔄'}
                            {trainingStatus === 'training' && '🔥'}
                            {trainingStatus === 'completed' && '✅'}
                            {trainingStatus === 'error' && '❌'}
                            {trainingStatus === 'stopped' && '⏹️'}
                        </div>
                        <div className="status-text">
                            {trainingStatus.charAt(0).toUpperCase() + trainingStatus.slice(1)}
                        </div>
                    </div>

                    <div className="training-logs">
                        <h3>Training Logs</h3>
                        <div className="logs-container">
                            {trainingLogs.map((log, index) => (
                                <div key={index} className="log-entry">{log}</div>
                            ))}
                        </div>
                    </div>
                </div>
                </div>

                {/* Trained Models */}
                <div className="models-panel">
                    <h2>Trained Models</h2>
                    <button
                        className="refresh-btn"
                        onClick={fetchModels}
                        style={{ marginBottom: '15px' }}
                    >
                        🔄 Refresh Models
                    </button>
                    <div className="models-list">
                        {models.length === 0 ? (
                            <div className="no-models-message">
                                <p>No trained models yet.</p>
                                <p>Start training to create your first model!</p>
                                <small>If you have trained models but they're not showing, try refreshing or check if the backend server is running.</small>
                            </div>
                        ) : (
                            models.map(model => (
                                <div key={model.id} className="model-card">
                                    <div className="model-info">
                                        <h4>{model.subject} Model</h4>
                                        <p>Size: {model.size} | Accuracy: {model.accuracy}%</p>
                                        <p>Trained: {new Date(model.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="model-actions">
                                        <button
                                            className="btn-secondary download-btn"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log('📥 Download button clicked for model:', model.id);
                                                downloadModel(model.id);
                                            }}
                                            style={{
                                                cursor: 'pointer',
                                                pointerEvents: 'auto',
                                                zIndex: 10
                                            }}
                                        >
                                            📥 Download
                                        </button>
                                        <button
                                            className="btn-danger delete-btn"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log('🗑️ Delete button clicked for model:', model.id);
                                                deleteModel(model.id);
                                            }}
                                            title={`Delete ${model.subject} model`}
                                            style={{
                                                cursor: 'pointer',
                                                pointerEvents: 'auto',
                                                zIndex: 10
                                            }}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainingDashboard;

import React, { useState, useEffect } from 'react';
import {
    getTrainingDataStats,
    uploadTrainingData,
    addTextTrainingData,
    generateSampleData
} from '../services/api';
import './DataManager.css';

const DataManager = ({ selectedSubject, onDataUpdate }) => {
    const [dataStats, setDataStats] = useState({});
    const [uploadMode, setUploadMode] = useState('file'); // 'file', 'text', 'database'
    const [textData, setTextData] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [generatedSampleData, setGeneratedSampleData] = useState('');


    const [selectedFormat, setSelectedFormat] = useState('jsonl');

    useEffect(() => {
        fetchDataStats();
    }, [selectedSubject]); // eslint-disable-line react-hooks/exhaustive-deps



    const fetchDataStats = async () => {
        try {
            const userId = localStorage.getItem('userId');
            const username = localStorage.getItem('username');

            console.log('DataManager: Checking authentication...');
            console.log('DataManager: userId from localStorage:', userId);
            console.log('DataManager: username from localStorage:', username);

            if (!userId) {
                console.warn('DataManager: No user ID found in localStorage - user may not be logged in');
                setDataStats({ train: 0, validation: 0, test: 0 });
                return;
            }

            console.log(`DataManager: Fetching data stats for subject: ${selectedSubject}`);
            const response = await getTrainingDataStats();
            console.log('DataManager: Received data:', response.data);
            setDataStats(response.data.stats || {});
        } catch (error) {
            console.error('DataManager: Error fetching data stats:', error);

            // Check if it's an authentication error
            if (error.response && error.response.status === 401) {
                console.warn('DataManager: Authentication failed - user may need to log in');
            }

            // Set default stats on error
            setDataStats({ train: 0, validation: 0, test: 0 });
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('subject', selectedSubject);

        try {
            console.log('DataManager: Uploading file...');
            const response = await uploadTrainingData(formData);

            if (response.data.success) {
                alert(`Successfully uploaded ${response.data.count} training examples!`);
                fetchDataStats();
                onDataUpdate && onDataUpdate();
            } else {
                alert(`Upload failed: ${response.data.error}`);
            }
        } catch (error) {
            alert(`Upload error: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleTextUpload = async () => {
        if (!textData.trim()) {
            alert('❌ Please enter some training data before submitting.');
            return;
        }

        // Validate data before submission
        try {
            const lines = textData.split('\n').filter(line => line.trim());
            let validCount = 0;
            let invalidCount = 0;

            for (const line of lines) {
                try {
                    const parsed = JSON.parse(line);
                    const hasInstruction = parsed.question || parsed.instruction || parsed.input;
                    const hasResponse = parsed.answer || parsed.response || parsed.output;

                    if (hasInstruction && hasResponse && hasInstruction.length >= 10 && hasResponse.length >= 5) {
                        validCount++;
                    } else {
                        invalidCount++;
                    }
                } catch {
                    invalidCount++;
                }
            }

            if (validCount === 0) {
                alert('❌ No valid training examples found. Please check your data format.');
                return;
            }

            if (invalidCount > 0) {
                const proceed = window.confirm(`⚠️ Found ${invalidCount} invalid entries out of ${lines.length} total.\nOnly ${validCount} valid entries will be processed.\n\nContinue?`);
                if (!proceed) return;
            }
        } catch (error) {
            alert(`❌ Data validation failed: ${error.message}`);
            return;
        }

        setIsUploading(true);
        try {
            console.log('DataManager: Sending text data...');
            const response = await addTextTrainingData({ subject: selectedSubject, data: textData });

            if (response.data.success) {
                alert(`✅ Successfully processed ${response.data.count} training examples!`);
                setTextData('');
                fetchDataStats();
                onDataUpdate && onDataUpdate();
            } else {
                alert(`❌ Processing failed: ${response.data.error}`);
            }
        } catch (error) {
            alert(`❌ Error: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };



    // Generate sample data locally based on subject
    const generateLocalSampleData = (subject) => {
        const sampleData = {
            mathematics: [
                { question: "What is 2 + 2?", answer: "2 + 2 = 4" },
                { question: "Solve for x: 2x + 5 = 11", answer: "2x + 5 = 11\n2x = 11 - 5\n2x = 6\nx = 3" },
                { question: "What is the derivative of x²?", answer: "The derivative of x² is 2x" },
                { question: "Calculate the area of a circle with radius 5", answer: "Area = πr² = π(5)² = 25π ≈ 78.54 square units" },
                { question: "What is the Pythagorean theorem?", answer: "The Pythagorean theorem states that in a right triangle, a² + b² = c², where c is the hypotenuse" }
            ],
            programming: [
                { question: "What is a variable in programming?", answer: "A variable is a storage location with an associated name that contains data which can be modified during program execution" },
                { question: "Explain what a function is", answer: "A function is a reusable block of code that performs a specific task and can accept parameters and return values" },
                { question: "What is the difference between == and === in JavaScript?", answer: "== performs type coercion and compares values, while === compares both value and type without coercion" },
                { question: "How do you declare an array in Python?", answer: "You can declare an array in Python using square brackets: my_array = [1, 2, 3, 4, 5]" },
                { question: "What is object-oriented programming?", answer: "Object-oriented programming (OOP) is a programming paradigm based on objects that contain data (attributes) and code (methods)" }
            ],
            science: [
                { question: "What is photosynthesis?", answer: "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen" },
                { question: "What is Newton's first law of motion?", answer: "Newton's first law states that an object at rest stays at rest and an object in motion stays in motion unless acted upon by an external force" },
                { question: "What is the chemical formula for water?", answer: "The chemical formula for water is H₂O, consisting of two hydrogen atoms and one oxygen atom" },
                { question: "What is DNA?", answer: "DNA (Deoxyribonucleic acid) is the hereditary material that contains genetic instructions for the development and function of living organisms" },
                { question: "What is the speed of light?", answer: "The speed of light in a vacuum is approximately 299,792,458 meters per second (about 300,000 km/s)" }
            ],
            history: [
                { question: "When did World War II end?", answer: "World War II ended on September 2, 1945, with the formal surrender of Japan" },
                { question: "Who was the first President of the United States?", answer: "George Washington was the first President of the United States, serving from 1789 to 1797" },
                { question: "What was the Renaissance?", answer: "The Renaissance was a period of cultural, artistic, and intellectual rebirth in Europe from the 14th to 17th centuries" },
                { question: "When did the Berlin Wall fall?", answer: "The Berlin Wall fell on November 9, 1989, marking a significant moment in the end of the Cold War" },
                { question: "What was the Industrial Revolution?", answer: "The Industrial Revolution was a period of major industrialization from the late 18th to early 19th century, transforming manufacturing and society" }
            ],
            literature: [
                { question: "Who wrote 'Romeo and Juliet'?", answer: "William Shakespeare wrote 'Romeo and Juliet', one of his most famous tragedies" },
                { question: "What is a metaphor?", answer: "A metaphor is a figure of speech that directly compares two unlike things without using 'like' or 'as'" },
                { question: "Who wrote '1984'?", answer: "George Orwell wrote '1984', a dystopian novel published in 1949" },
                { question: "What is the difference between a simile and a metaphor?", answer: "A simile compares two things using 'like' or 'as', while a metaphor makes a direct comparison without these words" },
                { question: "Who wrote 'Pride and Prejudice'?", answer: "Jane Austen wrote 'Pride and Prejudice', published in 1813" }
            ]
        };

        return sampleData[subject] || sampleData.mathematics;
    };

    const handleGenerateSampleData = async () => {
        if (!selectedSubject) {
            alert('❌ Please select a subject first before generating sample data.');
            return;
        }

        setIsUploading(true);
        try {
            console.log(`DataManager: Generating sample data for subject: ${selectedSubject}`);

            // Try API first, fallback to local generation
            let sampleData;
            let useLocal = false;
            let apiError = null;

            try {
                console.log('DataManager: Calling API to generate sample data...');
                const response = await generateSampleData(selectedSubject, 10);
                console.log('DataManager: API response:', response.data);

                if (response.data.success && response.data.samples && response.data.samples.length > 0) {
                    sampleData = response.data.samples;
                    console.log(`DataManager: Got ${sampleData.length} samples from API`);
                } else {
                    console.log('DataManager: API response invalid, using local data');
                    useLocal = true;
                    apiError = 'API returned invalid data';
                }
            } catch (error) {
                console.log('DataManager: API error, using local sample data:', error.message);
                useLocal = true;
                apiError = error.message;
            }

            if (useLocal) {
                console.log('DataManager: Using local sample data generation');
                sampleData = generateLocalSampleData(selectedSubject || 'mathematics');
            }

            if (!sampleData || sampleData.length === 0) {
                throw new Error('No sample data could be generated');
            }

            // Validate and format data as proper JSON for training
            const validatedData = sampleData.map((sample, index) => ({
                id: `${selectedSubject}_sample_${index + 1}`,
                instruction: sample.question || sample.instruction || sample.input,
                response: sample.answer || sample.response || sample.output,
                subject: selectedSubject,
                type: "training_sample",
                created_at: new Date().toISOString()
            }));

            // Format as JSONL (JSON Lines) for training
            const jsonlData = validatedData.map(item => JSON.stringify(item)).join('\n');

            setGeneratedSampleData(jsonlData);
            setTextData(jsonlData);
            setUploadMode('text'); // Switch to text mode to show generated data

            // Automatically submit the data to the training system
            try {
                await submitTrainingData(validatedData);
                console.log('DataManager: Sample data submitted successfully');
            } catch (submitError) {
                console.error('DataManager: Error submitting sample data:', submitError);
                // Continue anyway - data is still generated and visible
            }

            let message = `✅ Generated and validated ${sampleData.length} training examples for ${selectedSubject}!\n\n`;
            message += `Data source: ${useLocal ? 'Local generation' : 'API generation'}\n`;
            message += `Data has been automatically added to the training dataset in JSONL format.`;

            if (apiError) {
                message += `\n\n⚠️ Note: API was unavailable (${apiError}), used local generation instead.`;
            }

            alert(message);
            fetchDataStats();
            onDataUpdate && onDataUpdate();

        } catch (error) {
            console.error('DataManager: Error generating sample data:', error);
            alert(`❌ Error generating sample data: ${error.message}\n\nPlease try again or check the console for more details.`);
        } finally {
            setIsUploading(false);
        }
    };

    const submitTrainingData = async (data) => {
        try {
            // Submit the validated data to the training system
            const response = await addTextTrainingData({
                subject: selectedSubject,
                data: data,
                format: 'jsonl'
            });

            if (response.data.success) {
                console.log('Training data submitted successfully');
            }
        } catch (error) {
            console.error('Error submitting training data:', error);
        }
    };



    return (
        <div className="data-manager">


            {/* Data Statistics */}
            <div className="data-stats">
                <div className="stat-card">
                    <div className="stat-number">{dataStats.train || 0}</div>
                    <div className="stat-label">Training</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{dataStats.validation || 0}</div>
                    <div className="stat-label">Validation</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number">{dataStats.test || 0}</div>
                    <div className="stat-label">Test</div>
                </div>
            </div>



            {/* Data Validation Info */}
            <div className="validation-info">
                <h4>✅ Data Validation & Supported Formats</h4>
                <div className="validation-grid">
                    <div className="validation-item">
                        <h5>📝 Text Data</h5>
                        <ul>
                            <li>Question-Answer pairs</li>
                            <li>Instruction-Response format</li>
                            <li>Conversational data</li>
                            <li>Plain text documents</li>
                        </ul>
                    </div>
                    <div className="validation-item">
                        <h5>📁 File Formats</h5>
                        <ul>
                            <li>JSON/JSONL (recommended)</li>
                            <li>CSV with Q&A columns</li>
                            <li>Plain text (.txt)</li>
                            <li>Markdown (.md)</li>
                        </ul>
                    </div>
                    <div className="validation-item">
                        <h5>🔍 Quality Checks</h5>
                        <ul>
                            <li>Minimum text length</li>
                            <li>Character encoding validation</li>
                            <li>Format consistency</li>
                            <li>Duplicate detection</li>
                        </ul>
                    </div>
                    <div className="validation-item">
                        <h5>📊 Data Structure</h5>
                        <ul>
                            <li>{"{ \"question\": \"...\", \"answer\": \"...\" }"}</li>
                            <li>{"{ \"instruction\": \"...\", \"response\": \"...\" }"}</li>
                            <li>{"{ \"input\": \"...\", \"output\": \"...\" }"}</li>
                            <li>Custom field mapping</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <button
                    onClick={handleGenerateSampleData}
                    disabled={isUploading || !selectedSubject}
                    className="generate-btn"
                    title={!selectedSubject ? 'Please select a subject first' : `Generate sample training data for ${selectedSubject}`}
                >
                    {isUploading ? '⏳ Generating...' : '🎲 Generate Sample Data'}
                </button>
                <button
                    onClick={fetchDataStats}
                    disabled={isUploading}
                    className="refresh-btn"
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Upload Methods */}
            <div className="upload-methods">
                <div className="method-tabs">
                    <button
                        className={uploadMode === 'file' ? 'active' : ''}
                        onClick={() => setUploadMode('file')}
                    >
                        📁 File
                    </button>
                    <button
                        className={uploadMode === 'text' ? 'active' : ''}
                        onClick={() => setUploadMode('text')}
                    >
                        📝 Text
                    </button>
                </div>

                {/* File Upload */}
                {uploadMode === 'file' && (
                    <div className="upload-section">
                        <p>Upload JSONL file with training examples</p>
                        <input
                            type="file"
                            accept=".jsonl,.json,.txt"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                        {isUploading && <span>Uploading...</span>}
                    </div>
                )}

                {/* Text Input */}
                {uploadMode === 'text' && (
                    <div className="upload-section">
                        <div className="text-input-header">
                            <p>Training Data Text Editor</p>
                            <div className="text-controls">
                                <select
                                    value={selectedFormat}
                                    onChange={(e) => setSelectedFormat(e.target.value)}
                                    className="format-selector"
                                >
                                    <option value="jsonl">JSONL Format</option>
                                    <option value="json">JSON Format</option>
                                    <option value="txt">Plain Text</option>
                                </select>
                                <button
                                    onClick={() => setTextData('')}
                                    className="clear-btn"
                                    disabled={isUploading}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="text-editor-container">
                            <textarea
                                value={textData}
                                onChange={(e) => setTextData(e.target.value)}
                                placeholder={selectedFormat === 'jsonl' ?
                                    '{"input": "What is 2+2?", "target": "2+2 equals 4"}\n{"input": "Define AI", "target": "Artificial Intelligence is..."}' :
                                    selectedFormat === 'json' ?
                                    '[\n  {"input": "What is 2+2?", "target": "2+2 equals 4"},\n  {"input": "Define AI", "target": "Artificial Intelligence is..."}\n]' :
                                    'Enter your training text here...'
                                }
                                rows={12}
                                disabled={isUploading}
                                className="training-text-editor"
                                spellCheck={false}
                            />
                            <div className="text-stats">
                                <span>Characters: {textData.length}</span>
                                <span>Lines: {textData.split('\n').length}</span>
                                <span>Estimated Examples: {selectedFormat === 'jsonl' ? textData.split('\n').filter(line => line.trim()).length : 'N/A'}</span>
                            </div>
                        </div>

                        <div className="text-actions">
                            <button
                                onClick={handleTextUpload}
                                disabled={isUploading || !textData.trim()}
                                className="upload-btn primary"
                            >
                                {isUploading ? 'Processing...' : 'Add Training Data'}
                            </button>
                            <button
                                onClick={() => {
                                    const formatted = textData.split('\n').map(line => {
                                        try {
                                            return JSON.stringify(JSON.parse(line), null, 2);
                                        } catch {
                                            return line;
                                        }
                                    }).join('\n');
                                    setTextData(formatted);
                                }}
                                disabled={isUploading || !textData.trim()}
                                className="format-btn"
                            >
                                Format JSON
                            </button>
                            <button
                                onClick={() => {
                                    try {
                                        const lines = textData.split('\n').filter(line => line.trim());
                                        const validationResults = {
                                            total: lines.length,
                                            valid: 0,
                                            invalid: 0,
                                            errors: []
                                        };

                                        const validated = lines.filter((line, index) => {
                                            try {
                                                const parsed = JSON.parse(line);

                                                // Check if it has required fields
                                                const hasInstruction = parsed.question || parsed.instruction || parsed.input;
                                                const hasResponse = parsed.answer || parsed.response || parsed.output;

                                                if (!hasInstruction || !hasResponse) {
                                                    validationResults.errors.push(`Line ${index + 1}: Missing required fields (instruction/response)`);
                                                    validationResults.invalid++;
                                                    return false;
                                                }

                                                // Check minimum length
                                                if (hasInstruction.length < 10 || hasResponse.length < 5) {
                                                    validationResults.errors.push(`Line ${index + 1}: Text too short`);
                                                    validationResults.invalid++;
                                                    return false;
                                                }

                                                validationResults.valid++;
                                                return true;
                                            } catch (error) {
                                                validationResults.errors.push(`Line ${index + 1}: Invalid JSON - ${error.message}`);
                                                validationResults.invalid++;
                                                return false;
                                            }
                                        });

                                        let message = `✅ Validation Results:\n`;
                                        message += `Total lines: ${validationResults.total}\n`;
                                        message += `Valid: ${validationResults.valid}\n`;
                                        message += `Invalid: ${validationResults.invalid}\n`;

                                        if (validationResults.errors.length > 0) {
                                            message += `\n❌ Errors (showing first 5):\n`;
                                            message += validationResults.errors.slice(0, 5).join('\n');
                                        }

                                        alert(message);
                                    } catch (error) {
                                        alert(`❌ Validation failed: ${error.message}`);
                                    }
                                }}
                                disabled={isUploading || !textData.trim()}
                                className="validate-btn"
                            >
                                🔍 Validate Data
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default DataManager;

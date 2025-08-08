// server/services/wordGenerator.js

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');
const { GeminiAI } = require('./geminiAI');
const GeminiService = require('./geminiService');

let geminiAI;
let geminiService;

async function initializeGemini() {
    geminiService = new GeminiService();
    await geminiService.initialize();
    geminiAI = new GeminiAI(geminiService);
}

async function generateWord(topic) {
    try {
        if (!geminiAI) {
            await initializeGemini();
        }

        // Generate content using AI
        const prompt = `Create a comprehensive document about "${topic}". 
        Structure it with the following sections:
        1. Introduction
        2. Background
        3. Key Points (3-5 main points)
        4. Analysis
        5. Conclusion
        
        Make each section detailed and informative. Write in a professional tone.
        Format the response as JSON with this structure:
        {
            "title": "Document title",
            "introduction": "Introduction text",
            "background": "Background text", 
            "keyPoints": ["Point 1", "Point 2", "Point 3"],
            "analysis": "Analysis text",
            "conclusion": "Conclusion text"
        }`;

        const response = await geminiAI.generateText(prompt);
        
        let content;
        try {
            // Clean and parse JSON response
            let cleanedResponse = response.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            content = JSON.parse(cleanedResponse);
        } catch (parseError) {
            // Fallback content if JSON parsing fails
            content = {
                title: `Comprehensive Analysis: ${topic}`,
                introduction: `This document provides a comprehensive analysis of ${topic}. The following sections explore various aspects and provide detailed insights.`,
                background: `${topic} has become increasingly important in today's context. Understanding its fundamentals is crucial for making informed decisions.`,
                keyPoints: [
                    `Key aspect 1 of ${topic}`,
                    `Important consideration regarding ${topic}`,
                    `Critical factor in ${topic} implementation`,
                    `Future implications of ${topic}`
                ],
                analysis: `Through careful analysis of ${topic}, several patterns emerge. The data suggests multiple approaches and considerations that should be taken into account.`,
                conclusion: `In conclusion, ${topic} represents a significant area of focus that requires continued attention and strategic planning.`
            };
        }

        // Create document
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Title
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: content.title,
                                bold: true,
                                size: 32,
                            }),
                        ],
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),

                    // Introduction
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Introduction",
                                bold: true,
                                size: 24,
                            }),
                        ],
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400, after: 200 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: content.introduction,
                                size: 22,
                            }),
                        ],
                        spacing: { after: 300 }
                    }),

                    // Background
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Background",
                                bold: true,
                                size: 24,
                            }),
                        ],
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400, after: 200 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: content.background,
                                size: 22,
                            }),
                        ],
                        spacing: { after: 300 }
                    }),

                    // Key Points
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Key Points",
                                bold: true,
                                size: 24,
                            }),
                        ],
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400, after: 200 }
                    }),
                    
                    // Add each key point as a bullet
                    ...content.keyPoints.map(point => 
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `• ${point}`,
                                    size: 22,
                                }),
                            ],
                            spacing: { after: 150 }
                        })
                    ),

                    // Analysis
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Analysis",
                                bold: true,
                                size: 24,
                            }),
                        ],
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400, after: 200 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: content.analysis,
                                size: 22,
                            }),
                        ],
                        spacing: { after: 300 }
                    }),

                    // Conclusion
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Conclusion",
                                bold: true,
                                size: 24,
                            }),
                        ],
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400, after: 200 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: content.conclusion,
                                size: 22,
                            }),
                        ],
                        spacing: { after: 300 }
                    }),
                ],
            }],
        });

        // Save the file
        const outputDir = path.join(__dirname, '../public/generated_ppts');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const fileName = `${topic.replace(/\s+/g, '_')}_${Date.now()}.docx`;
        const filePath = path.join(outputDir, fileName);
        
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(filePath, buffer);
        
        console.log(`✅ Word document generated: ${fileName}`);
        return filePath;

    } catch (error) {
        console.error('Error generating Word document:', error);
        throw new Error(`Failed to generate Word document: ${error.message}`);
    }
}

module.exports = { generateWord };

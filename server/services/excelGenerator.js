// server/services/excelGenerator.js

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { GeminiAI } = require('./geminiAI');
const GeminiService = require('./geminiService');

let geminiAI;
let geminiService;

async function initializeGemini() {
    geminiService = new GeminiService();
    await geminiService.initialize();
    geminiAI = new GeminiAI(geminiService);
}

async function generateExcel(topic) {
    try {
        if (!geminiAI) {
            await initializeGemini();
        }

        // Create a new workbook
        const workbook = new ExcelJS.Workbook();
        
        // Generate data using AI
        const prompt = `Generate structured data for an Excel spreadsheet about "${topic}". 
        Provide data in the following format:
        1. A summary sheet with key metrics
        2. Detailed data with at least 10 rows
        3. Categories and subcategories
        
        Format the response as JSON with this structure:
        {
            "summary": {
                "title": "Summary title",
                "metrics": [{"label": "Metric name", "value": "Value", "description": "Description"}]
            },
            "data": [
                {"category": "Category", "item": "Item name", "value1": "Value", "value2": "Value", "description": "Description"}
            ]
        }`;

        const response = await geminiAI.generateText(prompt);
        
        let data;
        try {
            // Clean and parse JSON response
            let cleanedResponse = response.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            data = JSON.parse(cleanedResponse);
        } catch (parseError) {
            // Fallback data if JSON parsing fails
            data = {
                summary: {
                    title: `${topic} Summary`,
                    metrics: [
                        { label: "Total Items", value: "10", description: "Number of items analyzed" },
                        { label: "Categories", value: "5", description: "Number of categories" },
                        { label: "Status", value: "Active", description: "Current status" }
                    ]
                },
                data: Array.from({ length: 10 }, (_, i) => ({
                    category: `Category ${Math.floor(i / 2) + 1}`,
                    item: `Item ${i + 1}`,
                    value1: Math.floor(Math.random() * 100),
                    value2: Math.floor(Math.random() * 1000),
                    description: `Description for item ${i + 1} related to ${topic}`
                }))
            };
        }

        // Create Summary worksheet
        const summarySheet = workbook.addWorksheet('Summary');
        
        // Add title
        summarySheet.mergeCells('A1:E1');
        summarySheet.getCell('A1').value = data.summary.title;
        summarySheet.getCell('A1').font = { size: 16, bold: true };
        summarySheet.getCell('A1').alignment = { horizontal: 'center' };
        
        // Add headers for metrics
        summarySheet.getRow(3).values = ['Metric', 'Value', 'Description'];
        summarySheet.getRow(3).font = { bold: true };
        
        // Add metrics data
        data.summary.metrics.forEach((metric, index) => {
            const row = summarySheet.getRow(4 + index);
            row.values = [metric.label, metric.value, metric.description];
        });

        // Create Data worksheet
        const dataSheet = workbook.addWorksheet('Data');
        
        // Add headers
        dataSheet.getRow(1).values = ['Category', 'Item', 'Value 1', 'Value 2', 'Description'];
        dataSheet.getRow(1).font = { bold: true };
        
        // Add data
        data.data.forEach((item, index) => {
            const row = dataSheet.getRow(2 + index);
            row.values = [item.category, item.item, item.value1, item.value2, item.description];
        });

        // Auto-fit columns
        [summarySheet, dataSheet].forEach(sheet => {
            sheet.columns.forEach(column => {
                column.width = 20;
            });
        });

        // Save the file
        const outputDir = path.join(__dirname, '../public/generated_ppts');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const fileName = `${topic.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
        const filePath = path.join(outputDir, fileName);
        
        await workbook.xlsx.writeFile(filePath);
        
        console.log(`✅ Excel file generated: ${fileName}`);
        return filePath;

    } catch (error) {
        console.error('Error generating Excel file:', error);
        throw new Error(`Failed to generate Excel file: ${error.message}`);
    }
}

module.exports = { generateExcel };

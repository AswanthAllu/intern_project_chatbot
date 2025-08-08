const pdfMake = require('pdfmake');
const path = require('path');
const fs = require('fs');

// Helper function to generate PDF using pdfmake
async function generateReportPdf(topic, summary, sources) {
    const pdfMakePrinter = new pdfMake({
        Roboto: {
            normal: path.join(__dirname, '../fonts/Roboto-Regular.ttf'),
            bold: path.join(__dirname, '../fonts/Roboto-Medium.ttf'),
            italics: path.join(__dirname, '../fonts/Roboto-Italic.ttf'),
            bolditalics: path.join(__dirname, '../fonts/Roboto-MediumItalic.ttf')
        }
    });

    // Helper function to remove markdown bold syntax
    function removeBoldMarkdown(text) {
        if (typeof text !== 'string') return text;
        return text.replace(/\*\*(.*?)\*\*/g, '$1');
    }

    // Create sources list for PDF
    const sourcesList = sources && sources.length > 0 
        ? sources.map((source, index) => ({
            text: `${index + 1}. ${source.title || 'Source'}\n   ${source.url || 'No URL available'}\n`,
            margin: [0, 2]
        }))
        : [{ text: 'No sources available', margin: [0, 2] }];

    const docDefinition = {
        content: [
            // Header
            {
                text: 'Research Report',
                style: 'header',
                alignment: 'center',
                margin: [0, 0, 0, 20]
            },
            
            // Topic
            {
                text: `Topic: ${topic}`,
                style: 'subheader',
                margin: [0, 0, 0, 15]
            },
            
            // Executive Summary
            {
                text: 'Executive Summary',
                style: 'sectionHeader',
                margin: [0, 10, 0, 10]
            },
            {
                text: removeBoldMarkdown(summary || 'Summary not available due to API limitations.'),
                style: 'normal',
                margin: [0, 0, 0, 15]
            },
            
            // Sources section
            {
                text: 'Sources and References',
                style: 'sectionHeader',
                margin: [0, 20, 0, 10]
            },
            ...sourcesList,
            
            // Footer
            {
                text: `Generated on: ${new Date().toLocaleDateString()}`,
                style: 'footer',
                alignment: 'center',
                margin: [0, 30, 0, 0]
            }
        ],
        styles: {
            header: {
                fontSize: 20,
                bold: true,
                color: '#2c3e50'
            },
            subheader: {
                fontSize: 16,
                bold: true,
                color: '#34495e'
            },
            sectionHeader: {
                fontSize: 14,
                bold: true,
                color: '#2980b9'
            },
            normal: {
                fontSize: 11,
                lineHeight: 1.4
            },
            footer: {
                fontSize: 9,
                color: '#7f8c8d'
            }
        },
        defaultStyle: {
            font: 'Roboto'
        }
    };

    // Generate PDF and save to file
    const timestamp = Date.now();
    const fileName = `${topic.replace(/\s+/g, '_')}_${timestamp}.pdf`;
    const outputDir = path.join(__dirname, '../public/generated_ppts');
    
    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filePath = path.join(outputDir, fileName);
    
    return new Promise((resolve, reject) => {
        const pdfDoc = pdfMakePrinter.createPdfKitDocument(docDefinition);
        const stream = fs.createWriteStream(filePath);
        
        pdfDoc.pipe(stream);
        pdfDoc.end();
        
        stream.on('finish', () => {
            console.log(`✅ PDF report generated successfully: ${fileName}`);
            resolve(filePath);
        });
        
        stream.on('error', (error) => {
            console.error('Error generating PDF:', error);
            reject(error);
        });
    });
}

module.exports = {
    generateReportPdf
};

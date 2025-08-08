// server/services/simplePptGenerator.js

const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

async function generateSimplePPT(topic) {
  try {
    console.log(`📊 Generating simple PPT for topic: "${topic}"`);
    
    let pptx = new PptxGenJS();

    // Define slide content templates
    const slideData = [
      {
        title: topic,
        subtitle: "A Comprehensive Overview",
        isTitle: true
      },
      {
        title: "Introduction",
        content: [
          `Overview of ${topic}`,
          `Key objectives and goals`,
          `Scope and importance`,
          `Target audience and stakeholders`,
          `Presentation agenda`
        ]
      },
      {
        title: "Background",
        content: [
          `Historical context of ${topic}`,
          `Current market situation`,
          `Key players and stakeholders`,
          `Relevant trends and developments`,
          `Foundation and prerequisites`
        ]
      },
      {
        title: "Current Status",
        content: [
          `Present state of ${topic}`,
          `Recent developments and progress`,
          `Current metrics and performance`,
          `Existing solutions and approaches`,
          `Market position and adoption`
        ]
      },
      {
        title: "Challenges",
        content: [
          `Primary obstacles in ${topic}`,
          `Technical and operational challenges`,
          `Resource and budget constraints`,
          `Regulatory and compliance issues`,
          `Market and competitive pressures`
        ]
      },
      {
        title: "Opportunities",
        content: [
          `Growth potential in ${topic}`,
          `Emerging technologies and innovations`,
          `Market expansion possibilities`,
          `Strategic partnerships and collaborations`,
          `Future development prospects`
        ]
      },
      {
        title: "Conclusion",
        content: [
          `Key takeaways from ${topic}`,
          `Strategic recommendations`,
          `Next steps and action items`,
          `Expected outcomes and benefits`,
          `Call to action and follow-up`
        ]
      }
    ];

    // Create slides
    slideData.forEach((slide, index) => {
      let pptSlide = pptx.addSlide();
      
      if (slide.isTitle) {
        // Title slide
        pptSlide.addText(slide.title, { 
          x: 1, y: 2, w: 8, h: 1.5, 
          fontSize: 36, bold: true, color: "363636", align: "center" 
        });
        pptSlide.addText(slide.subtitle, { 
          x: 1, y: 4, w: 8, h: 1, 
          fontSize: 24, color: "666666", align: "center" 
        });
        
        // Add a decorative shape
        pptSlide.addShape(pptx.ShapeType.rect, {
          x: 2, y: 5.5, w: 6, h: 0.1,
          fill: { color: "4472C4" }
        });
      } else {
        // Content slide
        pptSlide.addText(slide.title, { 
          x: 0.5, y: 0.5, w: 9, h: 1, 
          fontSize: 28, bold: true, color: "363636" 
        });
        
        // Add bullet points
        slide.content.forEach((point, pointIndex) => {
          pptSlide.addText(`• ${point}`, { 
            x: 1, y: 1.8 + (pointIndex * 0.8), w: 8, h: 0.6, 
            fontSize: 18, color: "444444" 
          });
        });
        
        // Add slide number
        pptSlide.addText(`${index + 1}`, { 
          x: 9, y: 6.5, w: 0.5, h: 0.3, 
          fontSize: 12, color: "888888", align: "center" 
        });
      }
    });

    // Save the file
    const outputDir = path.join(__dirname, '../public/generated_ppts');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `${topic.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}_${Date.now()}.pptx`;
    const filePath = path.join(outputDir, fileName);
    
    await pptx.writeFile(filePath);
    
    console.log(`✅ Simple PPT generated successfully: ${fileName}`);
    return filePath;

  } catch (error) {
    console.error('Error generating simple PPT:', error);
    throw new Error(`Failed to generate PPT: ${error.message}`);
  }
}

module.exports = { generateSimplePPT };

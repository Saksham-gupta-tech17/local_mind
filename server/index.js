const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

const port = process.env.PORT || 5000;

// Global variable to store PDF text for immediate querying
let globalPdfText = '';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const filePath = req.file.path;
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        
        globalPdfText = data.text;
        
        // Cleanup the uploaded file after extracting text
        fs.unlinkSync(filePath);
        
        res.json({ message: 'File processed successfully', textLength: globalPdfText.length });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process file' });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { question, pdfText } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }
        
        const contextText = pdfText || globalPdfText;
        
        const prompt = `You are LocalMind. Use the provided PDF context to answer the user question. If the answer isn't there, say you don't know.\n\nContext: ${contextText}\n\nUser Question: ${question}`;
        
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        res.json({ reply: responseText });
        
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate response' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

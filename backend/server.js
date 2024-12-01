const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfPoppler = require('pdf-poppler'); // For thumbnail generation

const app = express();
const port = 3000;

// Middleware to serve static files from 'public' and 'uploads'
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for file upload handling
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Save uploaded files in 'uploads' folder
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Preserve original file name
    }
});
const upload = multer({ storage: storage });

// Endpoint to handle PDF upload
app.post('/upload', upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const pdfPath = req.file.path;
    const fileName = req.file.originalname;

    // Generate thumbnail from the first page of the uploaded PDF
    const options = {
        format: 'jpeg',
        out_dir: path.join(__dirname, 'uploads'),
        out_prefix: path.basename(fileName, '.pdf'),
        page: 1
    };

    try {
        await pdfPoppler.convert(pdfPath, options); // Generates [file].jpg thumbnail
        res.json({ message: 'PDF uploaded and thumbnail created successfully' });
    } catch (error) {
        console.error('Error generating thumbnail:', error);
        res.status(500).send('Error generating thumbnail.');
    }
});

// Endpoint to fetch the list of uploaded PDFs
app.get('/files', (req, res) => {
    fs.readdir(path.join(__dirname, 'uploads'), (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan files.');
        }

        // Filter only .pdf files
        const pdfFiles = files.filter(file => file.endsWith('.pdf'));
        res.json(pdfFiles);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

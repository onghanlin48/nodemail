// Import required modules
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Set up upload directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}_${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const fileType = path.extname(file.originalname).toLowerCase();
        if (fileType !== '.pdf') {
            return cb(new Error('Only PDF files are allowed'), false);
        }
        cb(null, true);
    }
});

// Route to handle file uploads
app.post('/upload', upload.single('pdf_file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file received',
        });
    }

    // Generate URL for the uploaded file
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.json({
        success: true,
        message: 'File uploaded successfully',
        file_url: fileUrl,
    });
});

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

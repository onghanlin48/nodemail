const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

class FileUploader {
    constructor() {
        // Base upload directory
        this.BASE_UPLOAD_DIR = path.join(__dirname, 'uploads');
        
        // Ensure base upload directory exists
        if (!fs.existsSync(this.BASE_UPLOAD_DIR)) {
            fs.mkdirSync(this.BASE_UPLOAD_DIR);
        }
    }

    createServer() {
        return http.createServer((req, res) => {
            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            if (req.method === 'POST' && req.url === '/upload') {
                this.handleFileUpload(req, res);
            } else {
                this.sendResponse(res, 404, 'Not Found');
            }
        });
    }

    handleFileUpload(req, res) {
        const chunks = [];
        let fileMetadata = {};

        req.on('data', (chunk) => {
            chunks.push(chunk);
        });

        req.on('end', () => {
            try {
                const boundary = req.headers['content-type'].split('; ')[1].replace('boundary=', '');
                const fullBody = Buffer.concat(chunks).toString('utf-8');
                
                // Parse multipart form data manually
                const parts = fullBody.split(`--${boundary}`);
                
                parts.forEach(part => {
                    if (part.includes('Content-Disposition: form-data;')) {
                        const fileDetails = this.parseFormData(part);
                        if (fileDetails) {
                            fileMetadata = fileDetails;
                        }
                    }
                });

                if (!fileMetadata.filename || !fileMetadata.content) {
                    return this.sendResponse(res, 400, 'Invalid file upload');
                }

                // Determine upload path
                const uploadPath = this.determineUploadPath(fileMetadata.subdir);
                const uniqueFilename = this.generateUniqueFilename(fileMetadata.filename);
                const fullPath = path.join(uploadPath, uniqueFilename);

                // Write file
                fs.writeFileSync(fullPath, fileMetadata.content);

                this.sendResponse(res, 200, JSON.stringify({
                    message: 'File uploaded successfully',
                    filename: uniqueFilename,
                    path: path.relative(__dirname, fullPath)
                }));

            } catch (error) {
                console.error('Upload error:', error);
                this.sendResponse(res, 500, 'Upload failed');
            }
        });
    }

    parseFormData(part) {
        const contentDispositionMatch = part.match(/name="(\w+)"; filename="(.+)"/);
        const fileContentMatch = part.match(/Content-Type: (.+)\r\n\r\n([\s\S]*)/);

        if (contentDispositionMatch && fileContentMatch) {
            const [, fieldName, filename] = contentDispositionMatch;
            const [, contentType, content] = fileContentMatch;
            
            // Extract optional subdirectory from field name
            const subdir = fieldName.startsWith('file_') 
                ? fieldName.replace('file_', '') 
                : null;

            return {
                filename, 
                content: Buffer.from(content.trim(), 'utf-8'),
                contentType,
                subdir
            };
        }
        return null;
    }

    determineUploadPath(subdir) {
        let uploadDir = this.BASE_UPLOAD_DIR;

        // If subdirectory is specified, create it
        if (subdir) {
            uploadDir = path.join(this.BASE_UPLOAD_DIR, subdir);
            
            // Ensure subdirectory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
        }

        return uploadDir;
    }

    generateUniqueFilename(originalFilename) {
        const timestamp = Date.now();
        const ext = path.extname(originalFilename);
        const baseName = path.basename(originalFilename, ext);
        
        return `${baseName}_${timestamp}${ext}`;
    }

    sendResponse(res, statusCode, message) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(message);
    }

    start(port = 3000) {
        const server = this.createServer();
        server.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    }
}

// Instantiate and start the server
const uploader = new FileUploader();
uploader.start();

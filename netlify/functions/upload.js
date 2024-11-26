const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Initialize Google Cloud Storage
const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
});

// Specify your Google Cloud Storage bucket
const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
const bucket = storage.bucket(bucketName);

exports.handler = async (event, context) => {
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: ''
        };
    }

    // Ensure it's a POST request
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }

    try {
        // Parse multipart form data
        const { file, subdirectory, customFilename } = parseMultipartData(event.body);

        // Generate unique filename
        const originalExtension = path.extname(file.filename);
        const timestamp = Date.now();
        const uniqueFilename = customFilename 
            ? `${customFilename}_${timestamp}${originalExtension}`
            : `${path.basename(file.filename, originalExtension)}_${timestamp}${originalExtension}`;

        // Construct full path
        const fullPath = subdirectory 
            ? `${subdirectory}/${uniqueFilename}` 
            : uniqueFilename;

        // Upload to Google Cloud Storage
        const fileBuffer = Buffer.from(file.content, 'base64');
        const storageFile = bucket.file(fullPath);
        await storageFile.save(fileBuffer, {
            metadata: {
                contentType: file.contentType || 'application/octet-stream'
            }
        });

        // Make the file publicly accessible (optional)
        await storageFile.makePublic();

        return {
            statusCode: 200,
            headers: { 
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'File uploaded successfully',
                filename: uniqueFilename,
                path: fullPath,
                publicUrl: storageFile.publicUrl()
            })
        };
    } catch (error) {
        console.error('Upload error:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                message: 'Upload failed',
                error: error.message
            })
        };
    }
};

// Helper function to parse multipart form data
function parseMultipartData(body) {
    try {
        const parsedBody = JSON.parse(body);
        const base64File = parsedBody.file;
        const subdirectory = parsedBody.subdirectory;
        const customFilename = parsedBody.customFilename;

        // Extract filename from base64 data
        const filenameMatch = base64File.match(/filename="([^"]+)"/);
        const filename = filenameMatch ? filenameMatch[1] : 'uploaded_file';

        // Extract base64 content
        const base64Content = base64File.split(',')[1];

        return {
            file: {
                filename,
                content: base64Content,
                contentType: base64File.split(':')[1].split(';')[0]
            },
            subdirectory,
            customFilename
        };
    } catch (error) {
        throw new Error('Invalid file upload data');
    }
}

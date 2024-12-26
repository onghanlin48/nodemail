const cloudinary = require('cloudinary').v2;

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Configure Cloudinary with environment variables
    cloudinary.config({
        cloud_name: 'dakrinvpf',
        api_key: '184762337876237',
        api_secret: 'SM6tkXj_NUCpZF5qCHL7dV-N8LI',
    });

    try {
        const data = JSON.parse(event.body);
        
        if (!data.resourceId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'resourceId is required' })
            };
        }

        const result = await cloudinary.api.delete_resources([data.resourceId], {
            type: 'upload',
            resource_type: 'raw'
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                result
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: error.http_code || 502,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};

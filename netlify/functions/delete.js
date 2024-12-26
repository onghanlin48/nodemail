const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dakrinvpf',
  api_key: '184762337876237',
  api_secret: 'SM6tkXj_NUCpZF5qCHL7dV-N8LI',
});

exports.handler = async function(event, context) {
  try {
    // Example: Deleting a resource from Cloudinary
    const result = await cloudinary.api.delete_resources(['resourceId'], {
      type: 'upload',
      resource_type: 'raw',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        result: result,
      }),
    };
  } catch (error) {
    console.error('Error deleting resource:', error);
    return {
      statusCode: 502,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};

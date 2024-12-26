const express = require('express');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'dakrinvpf',
    api_key: '184762337876237',
    api_secret: 'SM6tkXj_NUCpZF5qCHL7dV-N8LI',
});

const app = express();
app.use(express.json());

app.post('/delete-resource', async (req, res) => {
    const { resourceId } = req.body;

    try {
        const result = await cloudinary.api.delete_resources([resourceId], {
            type: 'upload',
            resource_type: 'raw',
        });
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));


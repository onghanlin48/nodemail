const nodemailer = require('nodemailer');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const data = JSON.parse(event.body);
    // const { recipient, subject, message } = JSON.parse(event.body);

    // Set up the transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "linwu212@gmail.com",
            pass: "pdhktjzacpzzcqhd"
        }
    });

    // Define mail options
    const mailOptions = {
        from: "linwu212@gmail.com",
        to: data.recipient,
        subject: data.subject,
        html: data.message
    };

    try {
        await transporter.sendMail(mailOptions);
        return { statusCode: 200, body: 'Email sent successfully' };
    } catch (error) {
        console.error('Error sending email:', error);
        return { statusCode: 500, body: 'Error sending email' };
    }
};

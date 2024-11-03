var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'linwu212@gmail.com',
        pass: 'pdhktjzacpzzcqhd'
    }
});

var mailOptions = {
    from: 'linwu212@gmail.com',
    to: 'onghanlin48@gmail.com',
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
};

transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
});
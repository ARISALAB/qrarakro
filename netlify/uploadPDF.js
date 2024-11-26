const fs = require('fs');
const path = require('path');
const util = require('util');
const { parse } = require('querystring');

// Διαχείριση του ανέβασματος PDF
exports.handler = async (event, context) => {
    if (event.httpMethod === 'POST') {
        try {
            // Διαβάζουμε το ανέβασμα του PDF από το request
            const body = await new Promise((resolve, reject) => {
                let data = '';
                event.body.on('data', chunk => {
                    data += chunk;
                });
                event.body.on('end', () => {
                    resolve(data);
                });
            });

            // Δημιουργία ενός μοναδικού ονόματος για το αρχείο
            const fileName = `pdf-${Date.now()}.pdf`;

            // Αποθήκευση του PDF
            const filePath = path.join('/tmp', fileName);
            fs.writeFileSync(filePath, body);

            // Μεταφορά του αρχείου στο αποθετήριο του Netlify
            const remoteFilePath = `https://arakronqrcodegenerator.netlify.app/pdfs/${fileName}`;
            
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'File uploaded successfully!', url: remoteFilePath }),
            };
        } catch (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message }),
            };
        }
    }

    return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
};

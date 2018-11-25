const fs = require('fs');

const storeFileName = "store/networkRecord.json"

const saveRecord = async (record) => {
    new Promise((resolve, reject) => {
        fs.open(storeFileName, 'w', (err, file) => {
            if (err) return reject(err);
            fs.writeFile(file, JSON.stringify(record), (err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
        });
    });
}

const getRecord = async (record) => 
    new Promise((resolve, reject) => {
        fs.readFile(storeFileName, (err, data) => {
            if (err) return reject(err);
            resolve(JSON.parse(data));
        });
    });


module.exports = { saveRecord, getRecord }
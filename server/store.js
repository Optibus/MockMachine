const fs = require('fs');

const storeFileName = "store/networkRecord.json"

const saveRecord = async (record) => {
    const prevData = await getRecord();
    const newData = Object.assign({}, prevData, record);
    new Promise((resolve, reject) => {
        fs.open(storeFileName, 'w', (err, file) => {
            if (err) return reject(err);
            fs.writeFile(file, JSON.stringify(newData), (err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
        });
    });
}

const getRecord = async () => 
    new Promise((resolve, reject) => {
        fs.readFile(storeFileName, (err, data) => {
            if (err) return reject(err);
            resolve(JSON.parse(data));
        });
    });


module.exports = { saveRecord, getRecord }

fs.readdir('./', (err, res) => res.filter(it => /.*\.log$/.exec(it)).forEach(file => fs.unlink(file, () => {})))
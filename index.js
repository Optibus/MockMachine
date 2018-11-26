const mockserver = require('mockserver-node');
const mockServerClient = require('mockserver-client').mockServerClient;
const express = require('express');
const setOnExitJob = require('./server/exit_server');
const { saveRecord, getRecord } = require('./server/store')
const { decorateApp, wrap } = require('@awaitjs/express');
const routerMockServer = require('./server/router');

const app = express();
const port = 3003;
const PortMithra = 3003;
const PortEuclid = 5000;

 app.get('/rec', wrap(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const rec = await getRecorded();
    saveRecord(rec);
    res.json(rec);
}));

app.get('/mock', wrap(async (req, res) => {
    await mockserver.stop_mockserver({ serverPort: 1081 });
    await mockserver.stop_mockserver({ serverPort: 1082 });
    await mockserver.start_mockserver({
        serverPort: 1081,
        trace: true
    })
    await mockserver.start_mockserver({
        serverPort: 1082,
        trace: true
    })
    const { mithraRecordedExpectation : mithraRec, euclidRecordedExpectation: euclidRec } = await getRecord();
    mockServerClient("localhost", 1081).mockAnyResponse(mithraRec);
    mockServerClient("localhost", 1082).mockAnyResponse(euclidRec);
    res.sendStatus(200);
}));

app.use('/mock', routerMockServer);

app.all('*', function (req, res) {
    console.log("****");
   res.send('hello world'); 
});

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));
setOnExitJob(() => server.close());

// On dev status
const fs = require('fs')
process.env.NODEMON && fs.readdir('./', (err, res) => res.filter(it => /.*\.log$/.exec(it)).forEach(file => fs.unlink(file, () => {console.log('rm')})));

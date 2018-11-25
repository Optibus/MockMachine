const mockserver = require('mockserver-node');
const mockServerClient = require('mockserver-client').mockServerClient;
const express = require('express');
const setOnExitJob = require('./server/exit_server');
const { saveRecord, getRecord } = require('./server/store')
const { decorateApp, wrap } = require('@awaitjs/express');

const app = express();
const port = 3003;
const PortMitra = 3000;
const PortEuclid = 5000;

 app.get('/rec', wrap(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const rec = await getRecorded();
    saveRecord(rec);
    res.json(rec);
}));

app.get('/mock', wrap(async (req, res) => {
    await mockserver.stop_mockserver();
    await mockserver.start_mockserver({
        serverPort: 1081,
        trace: true
    })
    await mockserver.start_mockserver({
        serverPort: 1082,
        trace: true
    })
    const { mithraRecordedExpectation : mithraRec, euclidrecordedExpectation: euclidRec } = await getRecord();
    mockServerClient("localhost", 1081).mockAnyResponse(mithraRec);
    mockServerClient("localhost", 1082).mockAnyResponse(euclidRec);
    res.sendStatus(200);
}));

app.get('/proxy', wrap(async (req, res) => {
    await startServers();
    res.sendStatus(200);
}));

app.get('/stop', function (req, res) {
    mockserver.stop_mockserver({
        serverPort: 1081
    });
    res.sendStatus(200);
});

app.get('/start', function (req, res) {
    mockServerClient("localhost", 1081).reset();
    mockServerClient("localhost", 1082).reset();
    res.sendStatus(200);
});

const getRecorded = async () => {
    //let recordedRequests = await mockServerClient("localhost", 1080).retrieveRecordedRequests({})
    let mithraRecordedExpectation = await mockServerClient("localhost", 1081).retrieveRecordedExpectations({})
    let euclidrecordedExpectation = await mockServerClient("localhost", 1082).retrieveRecordedExpectations({})
    return { mithraRecordedExpectation, euclidrecordedExpectation };
}

const startServers = async () => {
    await mockserver.start_mockserver({
        serverPort: 1081,
        proxyRemotePort: PortMitra,
        trace: true
    });

    await mockserver.start_mockserver({
        serverPort: 1082,
        proxyRemotePort: PortEuclid,
        trace: true
    });
}

startServers();


app.get('*', function (req, res) {
    console.log("****");
   res.send('hello world'); 
});

setOnExitJob(() => mockserver.stop_mockserver());
const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));
setOnExitJob(() => server.close());



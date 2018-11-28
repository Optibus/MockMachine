
const mockServer = require('./mockServer');
const { decorateApp, wrap } = require('@awaitjs/express');
const setOnExitJob = require('../exit_server');
const store = require('../store');

mockServer.start();
setOnExitJob(async () => mockServer.stop());

const successHelper = (foo) => wrap(async (req, res) => {
    try {
        const ans = await foo(req, res);
        res.status(200).send(ans);
    } catch ({message, stack}) {
        res.status(500).json({ error: {message, stack} });
    }
});

module.exports = {
    restart: successHelper(mockServer.start.bind(mockServer)),
    stop: successHelper(mockServer.stop.bind(mockServer)),
    resetRecording: successHelper(async (req, res) => {
        mockServer.resetRecording(req.params.name);
    }),
    saveCurrentRecording: successHelper(async (req, res) => {
        const record = await mockServer.getCurrentRecording();
        const recordName = mockServer.recordName;
        store.saveRecord({[recordName]: record});
        return {[recordName]: record};
    }),
    getRecords: successHelper(mockServer.getCurrentRecording.bind(mockServer)),
    startMocking: successHelper(async (req, res) => {
        const recordName = mockServer.recordName;
        const record = await store.getRecord();
        await mockServer.startMockState(record[mockServer.recordName]);
    }),
    getLogs: successHelper(mockServer.getLogs.bind(mockServer)),
}


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
    } catch (err) {
        res.status(500).send({error: err});
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
        store.saveRecord(record);
        return record;
    }),
    getRecords: successHelper(mockServer.getCurrentRecording.bind(mockServer)),
}

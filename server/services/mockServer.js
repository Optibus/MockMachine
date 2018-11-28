const mockserver = require('mockserver-node');
const mockServerClient = require('mockserver-client').mockServerClient;
const config = require('../../util/config');
const _ = require('lodash');
const axios = require("axios");


class MockServer {
    constructor() {
        this.serversConf = [
            {
                name: "MithraMock",
                proxyPort: 1081,
                serverPort: config.MITHRA_PORT
            },
            {
                name: "EuclidMock",
                proxyPort: 1082,
                serverPort: config.EUCLID_PORT
            }
        ]
        this.recordName = "default";
    }

    resetRecording(name) {
        console.log(`Resetting a new recording with name: ${name}`);
        this.recordName = name;
        this.serversConf.forEach(conf => mockServerClient("localhost", conf.proxyPort).reset());
    }

    async _getDataFromAll(type) {
        const getData = async ({proxyPort}) => mockServerClient("localhost", proxyPort)[`retrieve${type}`]({});
        const mapExpectation = async (conf) => ({[`${conf.name}${type}`]: await getData(conf) })
        return await Promise.all(this.serversConf.map(mapExpectation));
    }

    async getCurrentRecording() {
        return Object.assign.apply({}, await this._getDataFromAll("RecordedExpectations"));
    }

    async getLogs() {
        return Object.assign.apply({}, await this._getDataFromAll("LogMessages"));
    }

    async start() {
        if (this.isStarted) await this.stop();
        this.isStarted = true;
        return Promise.all(this.serversConf.map(conf =>
            mockserver.start_mockserver({
                serverPort: conf.proxyPort, 
                proxyRemotePort: conf.serverPort,
                trace: true
            })
        ));
    }

    async stop() {
        if (!this.isStarted) return;
        this.isStarted = false;
        return Promise.all(this.serversConf.map(conf => 
            mockserver.stop_mockserver({ serverPort: conf.proxyPort })
        ));
    }

    _stripRecord(record) {
        const { MithraMockRecordedExpectations : mithraRec, EuclidMockRecordedExpectations: euclidRec } = record;
        const filter = [...['method','path','queryStringParameters',].map(s => `httpRequest.${s}`),"httpResponse"]
        const stripRec = recList => recList.map(rec => _.pick(rec, filter));
        {mithraRec: stripRec(mithraRec), euclidRec: stripRec(euclidRec)}
    }

    async startMockState(record) {
        if (this.isStarted) await this.stop();
        this.isStarted = true;
        await Promise.all(this.serversConf.map(conf =>
            mockserver.start_mockserver({
                serverPort: conf.proxyPort,
                trace: true
            })
        ));
        const { mithraRec, euclidRec } = _stripRecord(record);
        // mockServerClient("localhost", 1081).mockAnyResponse(stripRec(mithraRec)).then(
        //     function () {
        //         console.log("expectation created");
        //     },
        //     function (error) {
        //         console.log(error);
        //     }
        // );
        await mockServerClient("localhost", 1082).mockAnyResponse(stripRec(euclidRec));
        console.log("Euclid mock started, going to run test");

    }

}

module.exports =  new MockServer();

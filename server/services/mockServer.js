const mockserver = require('mockserver-node');
const mockServerClient = require('mockserver-client').mockServerClient;
const config = require('../../util/config');


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
    }

    resetRecording(name) {
        console.log(`Resetting a new recording with name: ${name}`);
        this.name = name;
        this.serversConf.forEach(conf => mockServerClient("localhost", conf.proxyPort).reset());
    }

    async getCurrentRecording() {
        const getRec = async ({proxyPort}) => mockServerClient("localhost", proxyPort).retrieveRecordedExpectations({});
        const mapExpectation = async (conf) => ({[`${conf.name}RecordedExpectation`]: await getRec(conf) })
        const allRecordsMapped = await Promise.all(this.serversConf.map(mapExpectation));
        return Object.assign.apply({}, allRecordsMapped);
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

}

module.exports =  new MockServer();

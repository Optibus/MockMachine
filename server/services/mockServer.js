const mockserver = require('mockserver-node');
const mockServerClient = require('mockserver-client').mockServerClient;
const config = require('../../util/config');
const _ = require('lodash');
const axios = require("axios");
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');
const { detailedDiff } = require('deep-object-diff');



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
        const filter = [...['method','path','queryStringParameters',].map(s => `httpRequest.${s}`),
                        ...['customer','authorization','X-Optibus-Customer','X-Optibus-User','X-Optibus-OperationType']
                            .map(s => `httpRequest.headers.${s}`),
                        "httpResponse"];
        const convertArrToStrInMapValues = map =>
            Object.keys(map).forEach(k => map[k] = map[k][0]);
        const lowercase = map => 
            Object.keys(map).reduce((newMap, key) => (newMap[key.toLocaleLowerCase()] = map[key], newMap), {})
        const stripRec = recList => recList.map(rec => {
            let tmpRec = _.pick(rec, filter);
            tmpRec.httpRequest.headers = lowercase(tmpRec.httpRequest.headers);
            tmpRec.httpResponse.headers = lowercase(tmpRec.httpResponse.headers);
            convertArrToStrInMapValues(tmpRec.httpRequest.headers);
            convertArrToStrInMapValues(tmpRec.httpResponse.headers);
            tmpRec.httpRequest.queryStringParameters && convertArrToStrInMapValues(tmpRec.httpRequest.queryStringParameters);
            return tmpRec;
        });
        return {mithraRec: stripRec(mithraRec), euclidRec: stripRec(euclidRec)};
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
        const { mithraRec, euclidRec } = this._stripRecord(record);
        // mockServerClient("localhost", 1081).mockAnyResponse(stripRec(mithraRec)).then(
        //     function () {
        //         console.log("expectation created");
        //     },
        //     function (error) {
        //         console.log(error);
        //     }
        // );
        await mockServerClient("localhost", 1082).mockAnyResponse(_.omit(euclidRec[0], ["httpRequest.headers"])).then(
                function () {
                    console.log("expectation created");
                },
                function (error) {
                    console.log(error);
                }
        );
        console.log("Euclid mock started, going to run test");
        
        let ans = [];
        for(let i in mithraRec) {
        //return mithraRec.map(async ({httpRequest: httpRec}) => {
            const { httpRequest, httpResponse } = mithraRec[i];
            try {
                const { method, path, queryStringParameters: params, headers} = httpRequest;
                /*let res = await fetch(`http://localhost:3000${path}?${new URLSearchParams(params)}`,{
                    method,
                    headers: {
                        'authorization': 'testtoken',
                        'customer': headers.customer
                    }
                })*/
                let res = await axios({
                    method, params,
                    baseURL: 'http://localhost:3000',
                    url: path,
                    headers: {
                        'authorization': 'testtoken',
                        'customer': headers.customer
                    }
                });
                const newHttpResponse = this. _requestToJSON(res);
                ans.push({ detailedDiff: detailedDiff(httpResponse, newHttpResponse), newHttpResponse, expected: httpResponse, httpRequest });
            } catch (err) {
                console.log("Error on tring to fetch: " + err.message);
                let parsedErr = {
                    message: err.message,
                    stack: err.stack,
                }
                const newHttpResponse = this. _requestToJSON(err.response);
                ans.push({ Error: parsedErr, expected: httpResponse, newHttpResponse ,httpRequest });
            }
        }
        return ans;
    }

    _requestToJSON(request) {
        return {
            statusCode: request.status,
            reasonPhrase: request.statusText,
            headers: Object.assign({}, request.headers),
            body: JSON.stringify(request.data)
        }
    }

}

module.exports =  new MockServer();

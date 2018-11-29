const express = require('express');
const router = express.Router();
const mockServerHandler = require('./services/MockServerHttpHandler');


router.get('/restart', mockServerHandler.restart);
router.get('/stop', mockServerHandler.stop);
router.get('/resetRecording/:name', mockServerHandler.resetRecording);
router.get('/save', mockServerHandler.saveCurrentRecording);
router.get('/getCurrentRecording', mockServerHandler.getRecords);
router.get('/startMocking/:name', mockServerHandler.startMocking);
router.get('/log', mockServerHandler.getLogs);

module.exports = router;
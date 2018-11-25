
const jobs = []

const setOnExitJob = (job) => jobs.push(job)

// stop MockServer if Node exist abnormally
process.on('uncaughtException', function (err) {
    console.log('uncaught exception - stopping node server: ' + JSON.stringify(err));
    jobs.forEach(job => job());
    throw err;
});

// stop MockServer if Node exits normally
process.on('exit', function () {
    console.log('exit - stopping node server');
    jobs.forEach(job => job());
});

// stop MockServer when Ctrl-C is used
process.on('SIGINT', function () {
    console.log('SIGINT - stopping node server');
    jobs.forEach(job => job());
    process.exit(0);
});

// stop MockServer when a kill shell command is used
process.on('SIGTERM', function () {
    console.log('SIGTERM - stopping node server');
    jobs.forEach(job => job());
    process.exit(0);
});

module.exports = setOnExitJob;
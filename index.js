const express = require('express');
const setOnExitJob = require('./server/exit_server');
const routerMockServer = require('./server/router')

const app = express();
const port = 3003;

app.use('/mock', routerMockServer);

app.all('*', function (req, res) {
    console.log("machine.html");
   res.sendFile(__dirname+'/server/machine.html');
});

const server = app.listen(port, () => console.log(`MockMachine app listening on port ${port}!`));
setOnExitJob(() => server.close());

// On dev status
const fs = require('fs')
process.env.NODEMON && fs.readdir('./', (err, res) => res.filter(it => /.*\.log$/.exec(it)).forEach(file => fs.unlink(file, () => {console.log('rm')})));


// var proxy = require('http-proxy-middleware');
// const app2 = express();

// let aa;
// const myproxy = proxy({ 
//     target: 'http://localhost:3000', 
//     changeOrigin: false,
//     onProxyReq: (proxyReq, req, res) => {
//         //res.send("blabla");
//         console.log(aa != undefined);
//         if (aa) res = aa;
//     },
//     onProxyRes: (proxyRes, req, res) => {
//         aa = proxyRes;
//         myproxy.target = "";
//     },
// })
// app2.use('*', myproxy)
// app2.listen(3004, () => console.log(`Proxy app listening on port 3004!`))


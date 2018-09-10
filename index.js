// node internal
const fs = require('fs');
const http = require('http');
const https = require('https');

// node modules
const express = require('express');
const expressBasicAuth = require('express-basic-auth')
const axios = require('axios');

// read config
const config = require('./config.js');

// create express app
const app = express();

// small middleware to get the request text
app.use((req, res, next) => {
    req.setEncoding('utf8');
    req.rpc = '';
    req.on('data', chunk => req.rpc += chunk);
    req.on('end', () => next());
});

if(config.basicAuth.enabled === true) {
    app.use(basicAuth({
        users: config.basicAuth.users,
        unauthorizedResponse: () => {
            return {
                code: -32601,
                message: "Invalid credentials",
            };
        }
    }))
}

// if ssl is enabled, start https server
if(config.ssl.enabled) {
    https.createServer({
        key: fs.readFileSync(config.ssl.key),
        cert: fs.readFileSync(config.ssl.cert)
    }, app).listen(config.port, config.host);
} else {
    // standard server
    http.createServer(app).listen(config.port, config.host);
}


// listen to post requests
app.post(config.path, function (request, response, next)
{
    let rpc;

    // parse the json body and
    try {
        rpc = JSON.parse(request.rpc);
    } catch(e) {
        return response.status(500).send({
            code: -32700,
            message: 'Parse error'
        });
    }

    // check if the method is given and configured
    if(rpc.method === undefined || !(rpc.method in config.methods)) {
        return response.status(404).send({
            code: -32601,
            message: 'Method not found',
        });

    }

    // check if function is enabled
    if(config.methods[rpc.method] === false) {
        return response.status(403).send({
            code: -32601,
            message: "Not allowed",
        });

    }

    // get random node
    const node = config.nodes[Math.floor(Math.random() * config.nodes.length)];

    // deletgate request and send response to client
    axios.post(node, request.rpc).then((res) => {
        response.status(res.status).send(res.data);
    }).catch(e => {
        response.status(res.status).send(res.data);
    });
});


app.use(function(req, res, next) {
    return res.status(404).send({
        code: -32601,
        message: "Not found"
    });
});


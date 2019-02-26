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

console.log('PascalCoin proxy running');

// small middleware to get the request text
app.use((req, res, next) => {
    req.setEncoding('utf8');
    req.rpc = '';
    req.on('data', chunk => req.rpc += chunk);
    req.on('end', () => next());
});

if(config.basicAuth.enabled === true) {
    console.log(' - using basic authentication');

    app.use(expressBasicAuth({
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
if(config.ssl.enabled === true) {
    console.log(' - using SSL');
    https.createServer({
        key: fs.readFileSync(config.ssl.key),
        cert: fs.readFileSync(config.ssl.cert)
    }, app).listen(config.server.port, config.server.host);
} else {
    // standard server
    console.log(' - not using SSL!');
    http.createServer(app).listen(config.server.port, config.server.host);
}

// a flag indicating that there are active hooks
const hasHooksBefore = config.hooks !== undefined && config.hooks.before !== undefined;
const hasHooksAfter = config.hooks !== undefined && config.hooks.after !== undefined;

// listen to post requests
app.post(config.server.path, function (request, response, next)
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

    if(hasHooksBefore) {
        try {
            rpc.params = hookParams('*', rpc.params || {});
            rpc.params = hookParams(rpc.method, rpc.params || {});
        }
        catch(error) {
            return response.status(403).send({
                code: -32599,
                message: error.message,
            });
        }
    }

    // get random node
    const node = config.nodes[Math.floor(Math.random() * config.nodes.length)];

    // deletgate request and send response to client
    axios.post(node, request.rpc).then((res) => {
        let responseData = res.data;
        let requestData = JSON.parse(res.config.data);
        responseData = hookResponseData('*', responseData);
        responseData = hookResponseData(requestData.method, responseData);
        response.status(res.status).send(responseData);
    }).catch(e => {
        // no hook on errors
        response.status(res.status).send(
            hookResponseData(request.rpc.method, res.data)
        );
    });
});

/**
 * Small function that takes the respoinse of the node and calls a callback
 * with the data which either alters it or
 *
 * @param method
 * @param data
 * @returns {*}
 */
function hookResponseData(method, data)
{
    if(!hasHooksAfter || config.hooks.after[method] === undefined) {
        return data;
    }

    return (method === '*') ?
        config.hooks.after[method](method, data) :
        config.hooks.after[method](data);
}

/**
 * Small function that takes the params of the request and calls hooks with them
 *
 * @param method
 * @param params
 * @returns {*}
 */
function hookParams(method, params)
{
    if(!hasHooksBefore || config.hooks.before[method] === undefined) {
        return params;
    }

    return (method === '*') ?
        config.hooks.before[method](method, params) :
        config.hooks.before[method](params);
}

app.use(function(req, res, next) {
    return res.status(404).send({
        code: -32601,
        message: "Not found"
    });
});

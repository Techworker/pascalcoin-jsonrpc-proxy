# PascalCoin JSONRPC HTTP proxy

A simple HTTP proxy server in NodeJS for the JSON-RPC API of [PascalCoin](https://www.pascalcoin.org).

It allows to add the following functionalities:

 - Allow/Deny access to certain methods
 - HTTP Basic Authentication
 - SSL

It uses [http://expressjs.com/](http://expressjs.com/) and can easily be 
extended with more functionalities.

Donations in form of PascalCoin welcome! PASA `55033-26`.

License: MIT, see [LICENSE](/techworker/pascalcoin-rpc-proxy/LICENSE).

## Installation

Clone the repository:

```
git clone https://www.github.com/techworker/pascalcoin-jsonrpc-proxy
```

Copy the `config.js.dist` to `config.js`.

```
mv config.js.dist config.js
```

Run `npm install` to install the dependencies. Run `node index.js` to start 
the server.

By default the proxy is now available via http://127.0.0.1:8080 and the 
PascalCoin node should run under `http://127.0.0.1:4003`. The following curl
command should work as if you would call the node directly:

```
curl -X POST --data '{"jsonrpc":"2.0","method":"nodestatus","id":123}' http://127.0.0.1:8080
```

### Configuration

**`server`**

Configuration of the HTTP server itself.

 - host: The host the server binds to.
 - port: The port the server binds to.
 - path: The path the JSON-RPC API is accessible through.

**`basicAuth`**

Enables/Disables basic authentication for the server.

 - enabled: A flag indicating whether basic authentication is enabled.
 - users: An object with username -> password key value pairs.

**`ssl`**

Enables/Disables SSL for the server.

 - enabled: A flag indicating whether SSL is enabled.
 - key: The path to the key file
 - cert: The path to the certificate.
  
To test the functionality have a look at https://blog.mgechev.com/2014/02/19/create-https-tls-ssl-application-with-express-nodejs/ to generate a *test* certificate.

Testing via `curl` in the console needs the `--insecure` parameter if you work
with a test certificate.

**`nodes`**

The of proxied nodes. If more than one node is available, all requests will be
proxied to a random node.

**`methods`**

The list of key values where the key is the name of the JSON-RPC method and the
value a boolean value identifiying whether a call to a method is allowed or not.

Calls to methods that are not defined here are automatically denied.
# PascalCoin JSONRPC HTTP proxy

A simple HTTP proxy server in NodeJS for the JSON-RPC API of [PascalCoin](https://www.pascalcoin.org).

It allows to add the following functionalities:

 - Allow/Deny access to certain methods
 - HTTP Basic Authentication
 - SSL

It uses [http://expressjs.com/](http://expressjs.com/) and can easily be 
extended with more functionalities if you fork the repo.

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

**IMPORTANT! Please note that the config has some example hooks! Remove them in case
they are not needed**

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

**`hooks.before`**

It is possible to detect malicious parameters and check them. While the node 
itself does all the important parameter checking, it might still be useful to
check some parameter values to restrict access to the methods in a more granular
way.

Each before-hook method gets the params that will be used for the request. 
The hook function MUST return either the original or the altered parameters.

To deny access to a method with in case of a malicious or unwanted parameter
value, the method can throw an `Error` which will lead to the request being 
aborted and the error will be returned to the requester. The request will not
be delegated to the node.

There are 2 ways to check parameters for a method call.

1. Setup a '*' key with a method.
   This method will be called for every RPC call.
2. Setup a specified method
   This method will be called for a matching RPC call.

```js
// .. 
{
    hooks: {
        before: {
            '*': function(method, params) {
                // check depending on method and params
                return params;
            }
            findaccounts: function(params) {
                // we know the method, so check params
                if(params.max !== undefined && params.max > 100) {
                    throw new Error("Invalid MAX value, allowed 100");
                }

                // make sure to return
                return params;
            }
        }
    }
}
```
   
**`hooks.after`**

The after hooks will be called when the response is received from the node. 
You can alter the response or just return it.

```js
// .. 
{
    hooks: {
        after: {
            '*': function(method, data) {
                // act on method and data
                return data;
            }
            nodestatus: function(data) {
                // remove nodeservers info
                delete data.result.nodeservers;
                return data;
            }
        }
    }
}
```

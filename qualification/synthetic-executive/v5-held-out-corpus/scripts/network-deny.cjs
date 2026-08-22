"use strict";

const http = require("node:http");
const https = require("node:https");
const net = require("node:net");
const tls = require("node:tls");
const dns = require("node:dns");
const { syncBuiltinESMExports } = require("node:module");

function denyNetwork() {
  const error = new Error("V5_VALIDATION_NETWORK_DENIED");
  error.code = "V5_VALIDATION_NETWORK_DENIED";
  throw error;
}

http.request = denyNetwork;
http.get = denyNetwork;
https.request = denyNetwork;
https.get = denyNetwork;
net.connect = denyNetwork;
net.createConnection = denyNetwork;
tls.connect = denyNetwork;
dns.lookup = denyNetwork;
dns.resolve = denyNetwork;
globalThis.fetch = denyNetwork;
syncBuiltinESMExports();

globalThis.__KATHERINES_EYE_V5_NETWORK_DENIAL__ = Object.freeze({ enabled: true });

"use strict";

const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const fs = require("fs");
const stream = require("stream");

const PROTO_PATH = path.join(__dirname, "proto", "route.proto"); //    path.resolve("proto", "route.proto")
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const routeguide = grpc.loadPackageDefinition(packageDefinition).routeguide;

function dataStreaming(strm, cb) {
  console.log("server : streaming function");
  const myTransformStream = new stream.Transform({
    objectMode: true,
    emitClose: true,
    autoDestroy: true,
    transform(data, enc, cb) {
      cb(null, data.chk.toString());
    }
  });

  stream.pipeline(
    strm,
    myTransformStream,
    fs.createWriteStream("output.txt", {
      autoClose: true,
      emitClose: true
    }),
    err => {
      if (err) {
        console.log(`server side error : ${err}`);
        cb(err);
      } else {
        console.log("server side no error");
        cb(null, "server side finish");
      }

      strm.destroy();
    }
  );
}

function getServer() {
  const server = new grpc.Server();
  server.addService(routeguide.RouteGuide.service, {
    DataStreaming: dataStreaming
  });
  return server;
}

if (require.main === module) {
  const routeServer = getServer();
  routeServer.bind("localhost:3333", grpc.ServerCredentials.createInsecure());
  routeServer.start();
}

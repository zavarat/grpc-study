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
const client = new routeguide.RouteGuide(
  "localhost:3333",
  grpc.credentials.createInsecure()
);

const MyTransform = new stream.Transform({
  objectMode: true,
  emitClose: true,
  autoDestroy: true,
  transform(chk, enc, cb) {
    cb(null, { chk: chk });
  }
});

function runDataStreaming() {
  console.log("inside run-data-streaming()");

  const strm = client.dataStreaming((err, ret) => {
    if (err) {
      console.log("client : file transfer failed.");
      console.log(err);
    } else {
      console.log("client : file transfer succeeded.");
    }
  });

  stream.pipeline(
    fs.createReadStream("test.txt", {
      autoClose: true,
      emitClose: true
    }),
    MyTransform,
    strm,
    err => {
      console.log(`strm : ${strm}`);
      if (err) {
        console.log(err.message);
      } else {
        console.log("pipeline succeeded");
      }
    }
  );
}

if (require.main === module) {
  runDataStreaming();
}

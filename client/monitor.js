"use strict";

const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const fs = require("fs");
const stream = require("stream");

const PROTO_PATH = path.join(__dirname, "..", "protos", "study.proto"); //    path.resolve("proto", "route.proto")
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const study = grpc.loadPackageDefinition(packageDefinition).study;
const client = new study.MyService(
  "localhost:3333",
  grpc.credentials.createInsecure()
);

class MyTransform extends stream.Transform {
  constructor(opt) {
    super(opt);
  }

  _transform(chk, enc, cb) {
    if (chk.toString().includes("JUHYUN")) {
      cb(new Error("it is error"));
    } else {
      cb(null, { chk: chk });
    }
  }
}

function runMonitoring() {
  const strm = client.pipelineMonitoring((err, ret) => {
    if (err) {
      console.log("client : file transfer failed.");
      console.log(err);
    } else {
      console.log("client : file transfer succeeded.");
    }
  });

  const rr = fs.createReadStream("install.log");

  stream.pipeline(rr, new MyTransform({ objectMode: true }), strm, err => {
    if (err) {
      console.log(err.message);
      throw err;
    } else {
      console.log("error no detected");
    }
  });
}

if (require.main === module) {
  runMonitoring();
}

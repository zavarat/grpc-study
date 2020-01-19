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
    cb(null, {
      f: {
        chk: chk
      },
      hostname: process.env.HOSTNAME || "jh-test"
    });
  }
}

function runLogCllctr() {
  fs.watchFile("install.log", (curr, prev) => {
    if (curr.mtime - prev.mtime) {
      const rr = fs.createReadStream("install.log");
      const strm = client.logCllctr((err, res) => {
        if (err) {
          console.log("log collector failed.");
        } else {
          console.log("log collector succeeded.");
        }
      });

      rr.pipe(new MyTransform({ decodeStrings: false, objectMode: true })).pipe(
        strm
      );
    }
  });
}

if (require.main === module) {
  runLogCllctr();
}

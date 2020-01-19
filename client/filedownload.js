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

function runFileDownload() {
  //    다운로드 하고 싶은 파일 이름을 먼저 서버측에 알립니다.
  const strm = client.fileDownload({
    name: "install.log"
  });

  const tt = new stream.Transform({
    objectMode: true,
    transform(chk, enc, cb) {
      cb(null, chk.chk.toString());
    }
  });
  stream.pipeline(strm, tt, fs.createWriteStream("downloadOUTPUT.txt"), err => {
    if (err) {
      console.log(err.message);
    } else {
      console.log("클라이언트 : 파일 수신 완료!, 파이프라인 성공.");
    }
  });
}

if (require.main === module) {
  runFileDownload();
}

"use strict";

const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

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

async function runGetTkn() {
  //    클라이언트의 요청을 아래와 같이 정의합니다.
  let user = {
    id: 100
  };

  let promisified = function(req) {
    return new Promise((resolve, reject) => {
      //    서버측 함수 호출!
      client.getToken(req, (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  };

  try {
    const ret = await promisified(user);
    console.log(`client has gotten a new token : ${ret.tkn}`);
  } catch (err) {
    console.log(err.message);
  }
}

if (require.main === module) {
  runGetTkn();
}

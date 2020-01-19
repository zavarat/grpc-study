"use strict";

const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

let username = null;

function runChat() {
  const strm = client.chat();

  rl.on("line", data => {
    strm.write({
      who: username,
      msg: data
    });
  });

  strm.on("data", data => console.log(`${data.who} : ${data.msg}`));
}

if (require.main === module) {
  rl.question("What is your name? ", answer => {
    username = answer;
    runChat();
  });
}

"use strict";
const http = require("http");
const axios = require("axios");

const req = http.request("http://127.0.0.1:5555", res => {
  res.setEncoding("utf8");
  res.on("data", chunk => {
    console.log(`응답: ${chunk}`);
  });
  res.on("end", () => {
    console.log("No more data in response.");
  });
});

req.write("client start");
req.end("client end", () => console.log("please help me"));
axios.get("http://127.0.0.1:5555").then(res => console.log(res.data));

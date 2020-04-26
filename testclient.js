"use strict";

const req = require("http").request("http://127.0.0.1:4444");
const fs = require("fs");
const rr = fs.createReadStream("install.log");

rr.on("data", function handler(chk) {
  let ok = req.write(chk);
  if (!ok) {
    console.log("back-pressure");
    req.once("drain", handler);
  }
});

rr.on("end", () => console.log("file send finished"));

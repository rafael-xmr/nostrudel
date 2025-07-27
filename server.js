import { createRequestHandler } from "@remix-run/express";
import express from "express";

import * as build from "./build/server/index.js";

const app = express();
app.use(express.static("build/client"));

app.all("*", createRequestHandler({ build }));

app.listen(3000, () => {
  console.log("App listening on http://localhost:3000");
});

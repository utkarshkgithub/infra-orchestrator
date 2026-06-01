import app from "./app.js";
import {configure} from "@codegenie/serverless-express";

export const handler = configure({app})

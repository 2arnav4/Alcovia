import { Router } from "express";
import { SyncRequest } from "../types";
import { handleSync } from "../services/syncService";

export const syncRouter = Router();

syncRouter.post("/", (request, response) => {
  const syncRequest = request.body as SyncRequest;
  response.json(handleSync(syncRequest));
});

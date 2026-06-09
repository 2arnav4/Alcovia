import { Router } from "express";
import { getState } from "../services/syncService";

export const stateRouter = Router();

stateRouter.get("/", (_request, response) => {
  response.json(getState());
});

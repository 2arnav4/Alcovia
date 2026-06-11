import { Router } from "express";
import { resetServerData } from "../data/serverState";
import { resetAutomationDeliveries } from "../services/automationService";
import { getState } from "../services/syncService";

export const resetRouter = Router();

resetRouter.post("/", (_request, response) => {
  if (process.env.FOCUS_TEST_MODE !== "true") {
    response.status(403).json({ error: "Demo reset is disabled" });
    return;
  }

  resetAutomationDeliveries();
  resetServerData();
  response.json(getState());
});

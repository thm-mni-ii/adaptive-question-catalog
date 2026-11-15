import { createAuthRouter } from './auth/auth.routes';
import express, { Express } from "express";
import { Db } from "mongodb";
import { createQuestionRouter } from "./question/question.routes";
import { createCompetencyRouter } from "./competency/competency.routes";
import { createSessionRouter } from "./session/session.routes";
import { errorHandler } from "./shared/http";
import { createStudyConfigurationRouter } from "./studyConfiguration/studyConfiguration.routes";

/** Baut die Express-App auf, ohne sie zu starten. Von Tests direkt nutzbar. */
export function createApp(db: Db): Express {
  const app = express();

  // Same-origin access through Vite/nginx; no unrestricted cross-origin API.
  app.use(express.json({ limit: "64kb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => { res.json({ status: "ok" }); });
  app.use("/api_v2/auth", createAuthRouter());
  app.use("/api_v2", createQuestionRouter(db));
  app.use("/api_v2", createCompetencyRouter(db));
  app.use("/api_v2", createSessionRouter(db));
  app.use("/api_v2", createStudyConfigurationRouter(db));

  app.use(errorHandler);

  return app;
}

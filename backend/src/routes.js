import { Router } from "express";
import * as Auth from "./controllers/auth.controller.js";
import * as Project from "./controllers/project.controller.js";
import * as Task from "./controllers/task.controller.js";
import requireAuth from "./middlewares/auth.js";

const r = Router();

// Auth
r.post("/auth/register", Auth.register);
r.post("/auth/login", Auth.login);
r.get("/auth/me", requireAuth, Auth.me);

// Projects
r.get("/projects", requireAuth, Project.list);
r.post("/projects", requireAuth, Project.create);
r.get("/projects/:id", requireAuth, Project.detail);
r.put("/projects/:id", requireAuth, Project.update);
r.delete("/projects/:id", requireAuth, Project.remove);

// Tasks
r.get("/projects/:projectId/tasks", requireAuth, Task.list);
r.post("/projects/:projectId/tasks", requireAuth, Task.create);
r.put("/tasks/:id", requireAuth, Task.update);
r.delete("/tasks/:id", requireAuth, Task.remove);

export default r;

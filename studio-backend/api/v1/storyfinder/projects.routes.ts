import { Router } from "express";
import { getProjects, createProject, updateProject, deleteProject } from "./projects.service";

const router = Router();
router.get("/collections", getProjects);
router.post("/collections", createProject);
router.put("/collections/:id", updateProject);
router.delete("/collections/:id", deleteProject);
export default router;

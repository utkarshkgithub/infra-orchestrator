import { Router } from "express";
import {projectDetails, newProject , userProjects} from "./projects.controller.js"
import { authMiddlewareJWT } from "../../middleware/auth.middleware.js";

const projectRouter = Router();

projectRouter.post('/create',authMiddlewareJWT,newProject);
projectRouter.get('/all',authMiddlewareJWT,userProjects);
projectRouter.get('/:id',authMiddlewareJWT,projectDetails);

export default projectRouter;
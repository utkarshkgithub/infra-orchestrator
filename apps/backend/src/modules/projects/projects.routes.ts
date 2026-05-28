import { Router } from "express";
import {projectDetails, newProject , userProjects} from "./projects.controller.js"

const projectRouter = Router();

projectRouter.post('/create',newProject);
projectRouter.get('/',userProjects);
projectRouter.get('/details/:id',projectDetails);

export default projectRouter;
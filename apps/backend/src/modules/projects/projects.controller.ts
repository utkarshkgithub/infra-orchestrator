import { Response , NextFunction , Request } from "express";
import {createProject, getProjectDetails , getProjects} from "./projects.service.js"
import {ProjectSchema} from "./projects.types.js"
import type {ProjectInput} from "./projects.types.js"

// return the all user projects
export const userProjects = async (req: Request, res: Response)=>{
    const userId = req.user?.id!;
    const projects = await getProjects(userId);
    return res.status(200).json(projects);
}

// return specific project details
export const projectDetails = async (req :Request, res : Response) =>{
    const projectId = String(req.params.id);
    const userId = req.user?.id!
    const details = await getProjectDetails(projectId,userId)
    return res.status(200).json(details)
}

// create new project
export const newProject = async (req :Request, res : Response) =>{
    const rawproject = req.body as Partial<ProjectInput>
    rawproject.userId=req.user?.id;
    const parsedProject = ProjectSchema.parse(rawproject)
    const newProject = await createProject(parsedProject);
    return res.status(201).json(newProject);
}
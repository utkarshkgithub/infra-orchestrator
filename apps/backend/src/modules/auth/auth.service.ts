import {prisma} from '../../lib/prisma.js'
import { Request , Response } from 'express'
import { GitHubUser } from '../github/github.types.js'
import { ZodError } from 'zod';
import { AppError } from '../../middleware/error.middleware.js';

export const createUser = async (user: GitHubUser) => {
  if(!user.accessToken || !user.email){
    throw new AppError(400,`Validation Error ${!user.accessToken || !user.email}`)
  }
  return await prisma.user.upsert({
  where: {
    id: user.id
  },
  update: {
    accessToken: user.accessToken,
    avatarUrl: user.avatar_url,
    login: user.login,
    email: user.email!
  },
  create: {
    id: user.id,
    accessToken: user.accessToken,
    avatarUrl: user.avatar_url,
    login: user.login,
    email: user.email!
  }
});
};
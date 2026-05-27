import {Router} from 'express'
import { githubrouter } from '../github/github.routes.js';

const authrouter = Router();

authrouter.use('/github',githubrouter);

export default authrouter;
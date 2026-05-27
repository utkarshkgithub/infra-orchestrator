// Arctic does not hold state – we instantiate once and reuse.
import { GitHub} from 'arctic'
import {env} from '../../lib/env.js'
export const githubProvider = new GitHub(
    env.GITHUB_CLIENT_ID,
    env.GITHUB_CLIENT_SECRET,
    env.GITHUB_CALLBACK_URL
)
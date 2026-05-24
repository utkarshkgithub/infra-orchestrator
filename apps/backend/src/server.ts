import {env} from './lib/env.js'
import app from './app.js';

app.listen(env.PORT, ()=>{
    console.log(`backend is running ${env.PORT}`);
});

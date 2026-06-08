TODO:
1) implement in docker container
2) for static build do npm i then npm build
3) for first version instead of continous stream of logs send the final logs instead

The Responsibilities of the executer or worker node is to long poll sqs after getting the job do git clone  && cd to that project 
and install dependencied then build the static frontend after that push to s3 bucket after successful push do post request callback on the lambda backend for both error or success with logs


V1

Worker
 ├─ git clone
 ├─ npm ci
 ├─ npm run build
 └─ upload

No cache.

V2

Worker
 ├─ shared npm cache directory
 ├─ npm ci
 ├─ npm run build
 └─ upload

This is probably a 10-line change and can cut install times significantly.

V3

hash(package-lock.json)
          |
          v
dependency cache lookup
          |
     hit / miss


Just to explain this to me:
there is 2 filesystem :
1) oracle worker local => /tmp/builds/deploymentId/
2) s3 bucket => projectId/deploymentId/

These two are the base url only
projectId => string uuid
deploymentId => int

project = {
    id: string;
    userId: number;
    name: string;
    repoUrl: string;
    createdAt: Date;
    rootDir: string;
    installCmd: string;
    buildCmd: string;
    framework: string | null;
    envVars: JsonValue;
}
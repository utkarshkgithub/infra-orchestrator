import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../lib/env";
import path from "path";
import fs from "fs/promises";
import { logger } from "../lib/logger";

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.ACCESS_KEY,
    secretAccessKey: env.SECRET_ACCESS_KEY,
  },
  endpoint: "http://localhost:4566", // TODO: remove in prod (next lines too)
  forcePathStyle: true,
});

const pushToS3 = async (filePath:string,key:string)=>{
    const fileBuffer = await fs.readFile(filePath);
    const pushCommand = new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
        Body: fileBuffer
    })
    const res = await s3.send(pushCommand);
    logger.info(res);
    return ;
}

export const uploadDir = async (localDir:string, prefix="")=>{
    const entries = await fs.readdir(localDir,{
        withFileTypes: true
    });
    for(const entry of entries){
        const fullPath = path.join(localDir, entry.name)

        if(entry.isDirectory()){
            await uploadDir(
                fullPath,
                path.posix.join(prefix, entry.name)
            );
            continue;
        }
        const key=path.join(localDir, prefix)
        await pushToS3(fullPath,key);
        
    }
}
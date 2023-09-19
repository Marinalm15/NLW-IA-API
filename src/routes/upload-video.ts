import { FastifyInstance } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";
import { prisma } from "../lib/prisma";
import path from "path";
import { randomUUID } from "crypto";
import  fs  from "node:fs"
import  { pipeline }  from "node:stream"
import { promisify } from "node:util";

const pump = promisify(pipeline)

export async function uploadVideoRoute(app: FastifyInstance) {
    app.register(fastifyMultipart, {
        limits: {
            fileSize: 1048576 * 25 //25mb
        }
    })
    app.post('/videos', async (request, reply) => {
        const data = await request.file()

        if(!data) {
            return reply.status(400).send({error: "Missing file input."})
        }
        
        const extension = path.extname(data.filename)

        if(extension !== '.mp3') {
            return reply.status(400).send({error: "Invalid input type, pleaseupload a MP3"})
        }

        const fileBaseName = path.basename(data.filename, extension)
        const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`
        const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName)

        await pump(data.file, fs.createWriteStream(data.filename))

        const video = await prisma.video.create({
            data: {
                name: data.filename,
                path: data.filename,
            }
        })

        return {
            video
        }

    })
}
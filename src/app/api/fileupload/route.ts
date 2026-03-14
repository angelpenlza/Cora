import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
    region: 'auto',
    endpoint: `${process.env.S3_ENDPOINT}`,
    credentials: {
        accessKeyId: `${process.env.S3_KEY_ID}`,
        secretAccessKey: `${process.env.S3_SECRET_KEY}`
    }
})

/*
    POST
    - must be used as the submit option for a form
    - can be called using fetch() with POST method specified
    - MUST have an input of type="file" and name="user-image"
    - upon success, uploads the image file to the database
    - upon error, sends an error package
*/

export const POST = async(req: NextRequest, res: NextResponse) => {
    const formData = await req.formData()
    const file: File = formData.get('user-image') as File

    console.log('file: ', file.name)

    if(!file) {
        return NextResponse.json({ success: false }, { status: 404 })
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const putObjectCommand = new PutObjectCommand({
        Bucket: 'cora-image-database',
        Key: file.name,
        Body: buffer
    })

    try {
        const res = await r2.send(putObjectCommand);
        const data = {
            success: true, 
            status: 200,
            res: res
        }
        return NextResponse.json(data)
    } catch(err) {
        return NextResponse.json({ success: false }, { status: 500 })
    }
}

/*
    GET
    - can call without any parameters using fetch('/api/fileupload')
    - upon success returns an array of objects, with .key and .url values 
        - key: name of the image file
        - url: url to image, for use in <Image src={url} .../>
*/

export async function GET(req: NextRequest) {
    try {
        const listCommand = new ListObjectsV2Command({
            Bucket: 'cora-image-database'
        })

        const list = await r2.send(listCommand);
        const objects  = list.Contents ?? [];

        const images = await Promise.all(
            objects.map(async (obj) => {
                const command = new GetObjectCommand({
                    Bucket: 'cora-image-database',
                    Key: obj.Key!
                })

                const url = await getSignedUrl(r2, command);
                return {
                    key: obj.Key,
                    url
                }
            })
        )

        return NextResponse.json({
            success: true, 
            status: 200, 
            images: images
        })
    } catch (err) {
        const data = {
            success: false,
            status: 500,
            res: 'error retrieving data'
        }
        return NextResponse.json(data)
    }
}
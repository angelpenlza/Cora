import { NextResponse, NextRequest } from "next/server";
import { DeleteObjectCommand, GetObjectCommand, ListObjectsCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/** SigV4 presigned GET max (~7d). Default SDK expiry is ~15m, which breaks avatars stored in the DB. */
const PRESIGNED_GET_EXPIRES_SEC = 604800;

const r2 = new S3Client({
  region: 'auto',
  endpoint: `${process.env.S3_ENDPOINT}`,
  credentials: {
      accessKeyId: `${process.env.S3_KEY_ID}`,
      secretAccessKey: `${process.env.S3_SECRET_KEY}`
  }
})

/*-------------------
POST  
** helper function takes care of all the fetch stuff, check components > cfhelpers.tsx
  how to use: 
    - call using fetch('homepage/api/cloudflare', { method: POST, body: formData })
    - where formData is of type FormData
    - AND formData has values for 'rid' and 'image'
    - save the response from fetch in 
        const response = fetch(...)
        const receivedData = response.json()
      check to see if it was successful
        if(receivedData.success) ...
  what it does:
    - if formData is invalid or does not have the required values, will return a JSON throwing an error
    - otherwise, it will upload the user's image to Cloudflare, with its name being the image name + the RID
    ^ upon success, it will return a JSON with the success details 
---------------------*/

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  if(!formData) {
    return NextResponse.json({
      success: false,
      message: 'must input valid formData',
      status: 500,
    })
  }

  const database = formData.get('database') as string;
  const userImage: File = formData.get('image') as File
  const username = formData.get('username') as string;
  const RID = formData.get('rid')
  let key = '';

  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_AVATAR_URL?.trim();

  if(userImage.name === 'undefined' || !userImage) {
    return NextResponse.json({
      success: false,
      message: 'undefined image',
      status: 500,
    })
  }

  if(database === 'cora-image-database') {
    key = RID + '-' + userImage.name;
  } else {
    key = username + '-' + userImage.name;
  }

  const bytes = await userImage.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const putObjectCommand = new PutObjectCommand({
    Bucket: database,
    Key: key,
    Body: buffer
  })

  try {
    const databaseImage = new GetObjectCommand({
      Bucket: database,
      Key: key
    })
    const url =
      database === 'user-avatars' && publicBase
        ? `${publicBase.replace(/\/$/, '')}/${key}`
        : await getSignedUrl(r2, databaseImage, { expiresIn: PRESIGNED_GET_EXPIRES_SEC });
    const res = await r2.send(putObjectCommand)
    return NextResponse.json({
      success: true,
      message: res,
      url: url,
      status: 200
    })
  } catch(err) {
    return NextResponse.json({
      success: false,
      message: err,
      status: 500
    })
  }
}

/*-------------------
GET
** helper function takes care of all the fetch stuff, check components > cfhelpers.tsx
  how to use: 
    NO ARGUMNENT: call using fetch('homepage/api/cloudflare') 
    ARGUMENT: fetch('homepage/api/cloudflare')
  what it does: 
    IF CALLED WITH NO ARGUMENT: returns a set of key: value pairs 
    - key: the <image-name>-<report-id>
    - value: image url, used in Image component (<Image src={url} .../>)
    IF CALLED WITH ARGUMENT: returns the one, requested image
---------------------*/

export async function GET(req: NextRequest) {
/*-------------------
if an image is passed as an argument
- retrieve the one, requested image
---------------------*/
try {
  const formData = await req.formData();
  if(formData) {
    const database = formData.get('database') as string;
    const image: File = formData.get('image') as File;

    if(!database || !image) {
      return NextResponse.json({
        success: false, 
        message: 'error gettting info from form',
        status: 500,
      })
    }
    try {
      const databaseImage = new GetObjectCommand({
        Bucket: database,
        Key: image.name
      })
      const url = await getSignedUrl(r2, databaseImage, {
        expiresIn: PRESIGNED_GET_EXPIRES_SEC,
      });
      if(url) {
        return NextResponse.json({
          success: true,
          message: 'successfully got image',
          image: url,
          status: 200,
        })
      } else {
        return NextResponse.json({
          success: false,
          message: 'url did not properly load',
          status: 500,
        })
      }
    } catch(err) {
      return NextResponse.json({
        success: false,
        message: `error: ${err}`,
        status: 500,
      })
    }
  }
} 
/*-------------------
default response
- return all images in the cora-image-database
---------------------*/
  catch(err) {
    const images = new Map<string, string>();
    const database = 'cora-image-database';
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: database
      })

      const list = await r2.send(listCommand);
      const objects  = list.Contents ?? [];
      for(let i = 0; i < objects.length; i++) {
        const key = objects[i].Key;
        const command = new GetObjectCommand({
          Bucket: database,
          Key: key
        });
        const url = await getSignedUrl(r2, command, {
          expiresIn: PRESIGNED_GET_EXPIRES_SEC,
        });
        images.set(key!, url)
      }

      const serializedImages = Object.fromEntries(images)
      return NextResponse.json({
        success: true, 
        status: 200, 
        images: serializedImages
      })
    } catch (err) {
        return NextResponse.json({
          success: false,
          status: 500,
          images: []
        })
    }
  }
}

/*-------------------
DELETE
** helper function takes care of all the fetch stuff, check components > cfhelpers.tsx
  how to use: 
    call using fetch('homepage/api/cloudflare', { method: 'DELETE', body: image-name})
    where image-name is a STRING containing the name of the image you want to delete
  what it does: 
    deletes that image from 'cora-image-database' and returns a JSON package with status info
    json.success to see if it worked, !json.success to see if it failed
---------------------*/

export async function DELETE(req: NextRequest) {
  const formData = await req.formData();
  const image = formData.get('image') as string;
  const database = formData.get('database') as string;

  if(!image) {
    return NextResponse.json({
      success: false,
      status: 500,
      message: 'error getting image file'
    })
  }

  try {
    const res = await r2.send(
      new DeleteObjectCommand({
        Bucket: database,
        Key: image
      }),
    );
    console.log('res: ', res)
    return NextResponse.json({
      success: true,
      status: 200,
      message: 'deleted successfully'
    })
  } catch(err) {
    return NextResponse.json({
      success: false,
      status: 500,
      message: 'error deleting file'
    })
  }
}
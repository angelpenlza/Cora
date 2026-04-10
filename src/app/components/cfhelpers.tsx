/*--------------------------------
postImage

  function for posting an image to Cloudflare
  - input: name of the image as type STRING
  - output: JSON package confirming success or failure
--------------------------------*/
export async function postImage({image, database, username, rid}: {
  image: File | null,
  database: string | null,
  username: string | null,
  rid: string | null,
}) {
    if(!image || !database) { 
      return {
        status: 500,
        message: 'error getting image or database'
      }
    } 
    try {
      const formData = new FormData();
      formData.append('image', image)
      formData.append('database', `${database}`)
      if(username) { formData.append('username', username) }
      if(rid) { formData.append('rid', rid) }
      const res = await fetch(`${process.env.NEXT_PUBLIC_HOME_PAGE}/api/cloudflare`, {
        method: 'POST', 
        body: formData
      })
      const data = await res.json();
      return data;
    } catch(err) { 
      return {
        status: 500,
        message: 'error getting form'
      }
    }
}

/*--------------------------------
getImages() 
  function for getting image(s) from Cloudflare
  - input: no input required
  - output:  
    - upon success, returns array of all images in 'cora-image-database'
    - upon failure, returns an array with the error message as the first value
--------------------------------*/
export async function getImages() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOME_PAGE}/api/cloudflare`);
    const data = await res.json();
    if(data?.success)
      return data?.images;
    else 
      return [`${data?.message}`]
  } catch(err) {
    return [`${err}`]
  }
}

/*--------------------------------
getAvatar() 
- GENERAL FUNCTION, gets any, single image from a specified database, mainly used for avatars

Input
- image as a string
- name of the database as a string

Output
- the requested image
--------------------------------*/
export async function getImage({ image, database }: {
  image: string | null,
  database: string | null,
}) {
  if(!image || !database) { 
    console.log('image: ', image)
    console.log('database: ',database)
    return 'no image or database' 
  }

  // try {
  //   const formData = new FormData();
  //   formData.append('image', image)
  //   formData.append('database', database)

  //   const res = await fetch(`${process.env.NEXT_PUBLIC_HOME_PAGE}/api/cloudflare`, {
  //     method: 'GET',
  //     body: formData
  //   })
  //   const data = await res.json();
  //   if(data.status === 200) {
  //     return data.image
  //   } else  {
  //     return '/assests/user.png'
  //   }
  // } catch (err) { return err }
  try {
    
  } catch(error) { return null }
}

/*--------------------------------
deleteImage()
  function for deleting an image from Cloudflare
  - input: name of the image as a type STRING, or null
  - output: JSON package confirming success or failure
--------------------------------*/
export async function deleteImage({image, database}: {
  image: string | null,
  database: string | null,
}) {
  if(!image) { return 500 }
  try {
    const formData = new FormData();
    formData.append('image', image)
    formData.append('database', `${database}`)
    const res = await fetch(`${process.env.NEXT_PUBLIC_HOME_PAGE}/api/cloudflare`, {
      method: 'DELETE', 
      body: formData
    })

    const data = await res.json();
    if(data.success) {
      return 200;
    } else {
      console.log('data received a status 500: ', data?.message)
      return 500;
    }
  } catch(err) { return 500 }

}

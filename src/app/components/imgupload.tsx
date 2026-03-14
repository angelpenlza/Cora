import React from "react"

/*
  ----------------------------------------------
  handleSubmit()
  ----------------------------------------------
  - function must be used as the submit function for a form (no error checking yet)
  - calls the route.ts in /api/fileupload using POST method
  - right now, only logs the success or error
  - more details in route.ts
  ----------------------------------------------
*/

export const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
  event.preventDefault()
  
  console.log('event: ', event)
  const formData = new FormData(event.currentTarget)

  try {
    const res = await fetch('/api/fileupload', {
      method: 'POST',
      body: formData
    })
    const recv = await res.json()
    console.log('success: ', recv.res)
    
  } catch(err) {
    console.log('error: ', err)
  }
  
}

/*
  ----------------------------------------------
  getImages()
  ----------------------------------------------
  - function can be run in any client file
  - calls the route.ts in /api/fileupload using GET method
  - returns an array of objects, with .Key and .url values
  ----------------------------------------------
*/

export const getImages = async () => {
  try {
    const res = await fetch('/api/fileupload');
    const recv = await res.json();
    if(recv.success) {
      return recv.images;
    } else {
      return []
    }
  } catch(err) {
    console.log('error: ', err)
  }
}

/*

CODE THAT I USED TO TEST CLOUDFLARE
- not needed anymore but i'm leaving it here in case i need to reference anything

export default function ImageUpload() {
  const [image, setImage] = useState<string | null>(null)
  const imageRef = useRef(image)

  useEffect(() => {
    imageRef.current =  image
    console.log('ref: ', imageRef)
  }, [image])

  useEffect(() => {
    fetch('/api/fileupload?key=Corange.png')
      .then(res => res.json())
      .then(data => setImage(data.url))
  }, [])

  return (
    <form onSubmit={handleSubmit}>
      <h2>cloudflare</h2>
      <label htmlFor="name">name</label>
      <input name="name" id="name" />
      <label htmlFor="user-image">image</label>
      <input name="user-image" id="user-image" type="file" />
      <button type="submit">upload</button>
      <h3>test image</h3>
      { image &&  
        <Image 
          src={image}
          alt="image"
          width={100}
          height={100}
          unoptimized
        />
      }
    </form>
  )
}
*/
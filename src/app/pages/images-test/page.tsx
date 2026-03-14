'use client'

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

type ImageObject = {
  key: string
  url: string
}

export default function Images() {
  const [images, setImages] = useState<ImageObject[]>()
  const imageRef = useRef(images)

  useEffect(() => {
    imageRef.current = images 
  }, [images])


  useEffect(() => {
    try {
      fetch('/api/fileupload')
      .then(res => res.json())
      .then(data => {
        if(data.success) {
          console.log(data.images)
          setImages(data.images)
        } 
      })
      
    } catch(err) {
      console.log('error: ', err)
    }
  }, [])
  return (
    <div>
      <h2>images: </h2>
      { imageRef.current?.map((img) => (
        <Image 
          key={img.key}
          src={img.url}
          alt={img.key}
          width={100}
          height={100}
        />
      )) }
    </div>
  )
}
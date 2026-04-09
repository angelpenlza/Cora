'use client'

import { useLoadScript } from '@react-google-maps/api'
import { useEffect, useState, useRef } from 'react'

const libraries: any = ['places'] 
export function AddressForms() {
  const [address, setAddress] = useState({
    street: '',
    city: '',
    county: '',
    state: '', 
    country: '',
    coordinates: [0, 0]
  })
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
    libraries
  })

  const handlePlaceChanged = (address: any) => {
    const place = address.getPlace();
    if(place) {
      setAddressComponents(place)
    }
  }

  const setAddressComponents = (place: any) => {
    const addr = place.address_components;
    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
    console.log(`lat: ${lat}, lng: ${lng}`)

    setAddress(prev => ({...prev, 
      street: `${addr[0].short_name} ${addr[1].short_name}`,
      city: addr[2].short_name,
      state: addr[4].short_name,
      country: addr[5].short_name,
    }))
  }

  const handleChange = (e: any) => {

    const { name, value } = e.target;
    console.log(`setting: ${name}: ${value}`)
    setAddress((values) => ({...values, [name]: value}))
  }

  useEffect(() => {
    if(!isLoaded || loadError) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current!, {
      componentRestrictions: { country: 'us' }
    })
    autocomplete.addListener('place_changed', () => { handlePlaceChanged(autocomplete) })
  }, [isLoaded])

  if(!isLoaded) return <p>loading...</p>
  if(loadError) return <p>error: {loadError.message}</p>

  return (
    <>
      <input 
        placeholder='Address'
        name='street'
        id='street'
        ref={inputRef}
        value={address.street || ''}
        onChange={handleChange}
      />

      <input 
        placeholder='City'
        name='city'
        id='city'
        value={address.city || ''}
        onChange={handleChange}
      />

      <input 
        placeholder='State'
        name='state'
        id='state'
        value={address.state || ''}
        onChange={handleChange}
      />

      <input 
        placeholder='Country'
        name='country'
        id='country'
        value={address.country || ''}
        onChange={handleChange}
      />
    </>
  )
}
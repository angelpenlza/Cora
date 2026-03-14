'use client'

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { revalidate } from "./components/actions";

export default function Home() {
  const params = useSearchParams()
  const code = params.get('code') ?? ""
  const supabase = createClient()
  const [test, setTest] = useState('')

  supabase.auth.onAuthStateChange((event, session) => {
    if(event === 'SIGNED_IN') {
      console.log('SIGNED_IN', session)
      revalidate()
    }
  })

  return (
    <div className="home-container">
      <h2 className="home-message">
        Help keep everyone in your community alert and informed
        </h2>
        <h1 className="home-title">CORA</h1>
        <p className="home-mission-statement">
          Mission statement is in progress.
        </p>
      <div className="home-buttons">
        <Link href='/pages/explore' className="home-button">Explore</Link>
        <Link href='/pages/signup' className="home-button">Sign Up</Link>
        <Link href='/pages/images-test' className="home-button">images</Link>
      </div>
      <input type="hidden" name="code" value={code} />
      <div>{test}</div>
    </div>
  )
}
/* 
  Sign up page
  - added the same password toggle as Login page
  - added a confirm password feature, which requires
    users to re-enter their passwords. if the passwords 
    do NOT match, they get a message informing them of such,
    and the button is unavailable until the passwords match
  - so to make sure users enter the correct information, the 
    following things are required input fields: 
      - username of 3 characters or more
      - valid email address
      - two MATCHING passwords
    once all conditions are met, the user will be able to register
    to the database with the given information
*/

'use client'

import { signup } from "@/app/components/actions";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import Err from "@/app/components/err";


function SignupButton() {
  const { pending } = useFormStatus()
  return (
    <>
      <button formAction={signup} className="signup-button" disabled={pending}>
        {pending ? 'Signing up...' : 'Sign up'}
      </button>
    </>
  )
}

export default function Signup() {
    const searchParams = useSearchParams()
    const success = searchParams.get('success')
    const err = searchParams.get('err')
    const [pass, setPass] = useState('')
    const [confirmPass, setConfirmPass] = useState('')
    const [arePassesEqual, setArePassesEqual] = useState(true)
    const [showPass, setShowPass] = useState(false)


    useEffect(() => {
      if(confirmPass != pass) setArePassesEqual(false) 
      else setArePassesEqual(true)
    }, [confirmPass])

    const handlePassUpdate = (e: any) => { setPass(e.target.value) }
    const handleConfirmPassUpdate = (e: any) => { setConfirmPass(e.target.value) }
    const togglePass = () => {
      if(showPass) { setShowPass(false) }
      else { setShowPass(true) }
    }

    return (
      <form className="signup-container">
        <h2>Sign up</h2>

        <label htmlFor="username">Username (min 3 characters)</label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          minLength={3}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type={ showPass ? 'text' : 'password'}
          autoComplete="new-password"
          required
          onChange={handlePassUpdate}
        />

        <label htmlFor="password">Confirm Password</label>
        <input
          id="password"
          name="password"
          type={ showPass ? 'text' : 'password'}
          autoComplete="new-password"
          required
          onChange={handleConfirmPassUpdate}
        />

        <div className="toggle-pass" onClick={togglePass}>
          { showPass ? <>hide</> : <>show</> } password
        </div>

        { arePassesEqual ? <>
          <SignupButton />      
        </> : <>
          <div>passwords are not equal</div>
          <div className="signup-button-blocked">
            Signup
          </div>
        </>}


        <footer>Already have an account? <Link href='/pages/login'>Log in here</Link></footer>
        { success ? <div className="success">{success}</div> : <></> }
        { err ? <Err message={err} /> : <></> }
      </form>
    )
  }
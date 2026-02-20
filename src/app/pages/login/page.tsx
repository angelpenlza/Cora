/* 
  Log in page
  - added a toggle password button, which allows the 
    user to change the input type from 'passord' to 
    'text', in case they want to see their password
  - added link to /pages/forgotpass for password support
*/

'use client'

import { login } from "@/app/components/actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation"
import { useState } from "react";
import Err from "@/app/components/err";

export default function Login() {
  const searchParams = useSearchParams();
  const errMessage = searchParams.get('err')
  const [showPass, setShowPass] = useState(false)

  const togglePass = () => {
    if(showPass) { setShowPass(false) } 
    else { setShowPass(true) }
  }

  return (
    <form className="login-container">
      <h2>Login</h2>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required />

      <label htmlFor="password">Password</label>
      <input id="password" name="password" 
        type={ showPass ? 'text' : 'password' } required />
      <div className="toggle-pass" onClick={togglePass}>
        { showPass ? <>hide</> : <>show</> } password
      </div>
      <Link href='/pages/forgotpass'>Forgot Password?</Link>

      <button formAction={login} className="login-button">Login</button>
      <footer>Don't have an account? <Link href='/pages/signup'>Sign-up here</Link></footer>
      { errMessage ? <Err message={errMessage}/> : <></>}
    </form>
  )
}
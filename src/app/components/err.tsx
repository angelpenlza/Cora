/* 
  Error component 
  - input: 
      a string containing an error message
  - output: 
      an error block (with a className of 'error') 
      with an X, allowing you to dismiss the message

  - issues: all the pages that use this component do so by
    using search queries, meaning the error is in the link itself.
    if the user clicks the X to dismiss the message, but then reloads
    the page, they will once again receive the error message even 
    though there is no error. not a huge issue but a little bit misleading.
*/

'use client'

import { useState } from "react"

/**
 * Small dismissible error banner component.
 *
 * Props:
 * - `message`: string to display; when falsy, nothing is rendered.
 *
 * Note: state is local only. If an error is passed via query string and the
 * page reloads with the same URL, the banner will reappear (by design).
 */
export default function Err({ message }: any) {
  const [show, setShow] = useState(true)
  const dismiss = () => {
    setShow(false)
  }

  return (
    <> { 
      message && show ?
        <div className="error">
          Error: {message}
          <div onClick={dismiss}>X</div>
        </div> :
        <></>
      } </>
  )
}
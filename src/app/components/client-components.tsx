'use client'

import { useEffect, useState } from "react"
import Image from "next/image"
import { deleteReport, updateProfile } from "./actions"

/**
 * Small dismissible error banner component.
 *
 * Props:
 * - `message`: string to display; when falsy, nothing is rendered.
 *
 * Note: state is local only. If an error is passed via query string and the
 * page reloads with the same URL, the banner will reappear (by design).
 */
export function Err({ message }: any) {
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

/*---------------------
<Reports /> 
displays a set of given reports (with images)

Input
- reports: an array of reports to display (can get from supabase and pass directly)
- images: an array of the reports' images (can get from cloudflare and pass directly)
- inAccount: boolean value, if true, will display a delete button with each report
---------------------*/
export function Reports({ reports, images, inAccount }: any | null) {
  if(reports.length <= 0) { return <div className="report-container">No reports</div> } 
  else if(!reports || !images) { return <div className="report-container">Error getting reports or images</div> } 
  else {
    const formattedReports = reports?.map((report: any) => {
      const url = images[report.report_id + '-' + report.report_image];
      return (
        <div key={report.report_id} className="report">
          <div className="report-header">
            <h2 className="report-category">{report.category}</h2>
            <div className={report.status}>{report.status}</div>
          </div>
          <h3 className="report-title">{report.report_title}</h3>
          <p className="report-desc">{report.report_description}</p>

          {
            inAccount ? 
            <div>
              <Image 
                src={url}
                alt="usr-img"
                width={100}
                height={100}
                className="report-image"
              /> 
              <form>
                <input type="hidden" name="rid" value={report.report_id}/>
                <button formAction={(e) => {
                  const confirm = window.confirm('delete post?');
                  if(confirm) { 
                    console.log('e: ', e)
                    deleteReport(e) 
                  } 
                }} className="report-delete">
                  delete
                </button>
              </form>
            </div> : 
            <div className="report-details">
              <div className="report-dates">
                <div>{report.updated_at}</div>
                <div>{report.address}</div>
              </div>
              <div className="votes">
                <div>upvotes</div>
                <div>downvotes</div>
              </div>
            </div>
          }
        </div>
      )
    });
    return (
      <div className="report-container">
        {formattedReports}
      </div>
    );
  }
}

/*---------------------
<Dropdown />
- a provides a dropdown menu for a form

Input
- array of options as strings
- the function to update the state
- category of type string to show the current category
---------------------*/
export function Dropdown({ options, update, category }: {
  options: string[], 
  update: Function,
  category: string
}) {
  const [showOptions, setShowOptions] = useState(false);

  const toggle = () => {
    if(showOptions) setShowOptions(false)
    else setShowOptions(true)
  }

  const selectOption = (category: string) => {
    update(category);
    setShowOptions(false);
  }

  const categories = options.map((option) => {
    return (
      <div 
        key={option} 
        onClick={() => selectOption(option)}
        className="dropdown-menu-item"
      >
        {option}
      </div>
    )
  })
  
  return (
    <div className="category-container">
      <div onClick={toggle} className="upload-input">
        {
          category.length <= 0 ? 
          <div className="pre-select">Select a category.</div> :
          <div>{category}</div>
        } 
      </div>
      {
        showOptions ? 
        <div className="dropdown-menu-container">
          {categories}
        </div> : <></>
      }
    </div>
  )

}

/*
<UpdateAccount />
- update your username, profile picture, and password
*/
export function UpdateAccount(profile: any) {
  const user = profile.profile;
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [name, setName] = useState(user.full_name);
  // const [email, setEmail] = useState(user.email);
  const [phoneNum, setPhoneNum] = useState(user.phone);
  const [pfp, setPfp] = useState<string | null>(user.avatar_url)

  console.log('type of url: ', user)

  const toggleEditing = () => {
    if(editing) { setEditing(false) }
    else { setEditing(true) }
  }

  const deletePhoto = () => {
    URL.revokeObjectURL(`${pfp}`)
    setPfp('/assets/user.png');
  }

  const deleteChanges = () => {
    const confirm = window.confirm('revert changes?');
    if(confirm) {
      setUsername(user.username)
      setName(user.name)
      setPhoneNum(user.phoneNum)
      deletePhoto();
      toggleEditing();
    }
  }

  const updateUsername = (e: any) => { setUsername(e.target.value) }
  const updateName = (e: any) => { setName(e.target.value) }
  // const updateEmail = (e: any) => { setEmail(e.target.value) }
  const updatePhoneNum = (e: any) => { setPhoneNum(e.target.value) }
  const updatePfp = (e: any) => { 
    const url = URL.createObjectURL(e.target.files[0]);
    setPfp(url);
  }

  if(!pfp) {
    deletePhoto();
  }

  useEffect(() => {
    console.log('pfp changed: ', pfp)
    return () => {
      if(pfp) {
        URL.revokeObjectURL(pfp)
      }
    };
  }, [pfp])

  return (
    <form className="upload-container">
      <h3>Update Profile</h3>

      <div className="update-pfp-container">
        <Image 
          src={`${pfp}`}
          alt="pfp"
          width={100}
          height={100}
          className="pfp"
        />
        {
          editing ? 
          <div className="image-options">
            <input id="image" name="image" type="file" accept="image/png, image/jpeg" onChange={updatePfp} /> 
            <div onClick={deletePhoto}>delete photo</div>
          </div> : <></>
        }
      </div>


      <label htmlFor="username">Username</label>
      <input 
        className="upload-input"
        id="username"
        name="username" 
        value={username} 
        onChange={updateUsername} 
        disabled={!editing} 
        required
      />

      <label htmlFor="name">Name</label>
      <input 
        className="upload-input"
        id="name"
        name="name" 
        value={name} 
        onChange={updateName} 
        disabled={!editing} 
        required
      />

      {/* <label htmlFor="email">Email</label>
      <input 
        className="upload-input"
        id="email"
        name="email" 
        value={email} 
        onChange={updateEmail} 
        disabled={!editing} 
        required
      /> */}

      <label htmlFor="phone">Phone Number</label>
      <input 
        className="upload-input"
        id="phone"
        name="phone" 
        value={phoneNum} 
        onChange={updatePhoneNum} 
        disabled={!editing} 
        required 
      />

      <input type="hidden" name="uid" id="uid" value={user.id} required />

      {
        editing ? 
        <>
          <button onClick={deleteChanges}>Delete Changes</button>
          <button formAction={updateProfile}>Submit Changes</button>
        </>
        :
        <button onClick={toggleEditing}>Edit Profile</button>
      }
    </form>
  )
}
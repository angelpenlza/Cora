'use client'

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { deleteReport, updateProfile } from "./actions"
import Link from "next/link"

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
        <Link href={`/pages/user-report?report=${report.report_id}`} key={report.report_id} className="report">
          <div className="report-header">
            <h2 className="report-category">{report.category}</h2>
            <div className={report.status}>{report.status}</div>
          </div>
          <h3 className="report-title">{report.report_title}</h3>
          <p className="report-desc">{report.report_description}</p>

          {
            inAccount ? 
            <div>
              {/* <Image 
                src={url}
                alt="usr-img"
                width={100}
                height={100}
                className="report-image"
              />  */}
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
        </Link>
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

/*---------------------
<Avatar />
- shows the user's avatar
- input the src link or null
- outputs a formatted avatar with provided src link
- or a default user avatar if null is provided
---------------------*/
export function Avatar({avatar_url}: {avatar_url: string | null}) {
  if(avatar_url) {
    return (
      <Image 
        src={avatar_url}
        alt="usr-pfp"
        width={100}
        height={100}
        className="pfp"
      />
    )
  } else {
    return (
      <img
        src='/assets/user.png'
        alt="usr-pfp"
        width={100}
        height={100}
        className="pfp"
      />
    )
  }
}

/*---------------------
<UpdateAccount />
- update your username, profile picture, and password
---------------------*/
export function UpdateAccount({user}: {user: any}) {
  const [editing, setEditing] = useState(false);
  const [deleteImage, setDeleteImage] = useState(false);

  const deleteAvatar = (e: any) => {
    e.preventDefault();
    setDeleteImage(true);
  }

  const toggleEditing = (e: any) => {
    e.preventDefault();
    if(editing) { 
      setDeleteImage(false);
      setEditing(false) 
    }
    else { setEditing(true) }
  }

  const DisplayAvater = ({ url }: { url: string }) => {
    const [pfp, setPfp] = useState(url);
    const handleImageChange = (e: any) => {
      setPfp(URL.createObjectURL(e.target.files[0]));
      setDeleteImage(false);

    }
    return (
      <>
        {
          editing ? 
            <div>
              <Avatar avatar_url={deleteImage ? null : pfp}/>
              <input 
                name={deleteImage ? "remove" : "image"}
                id="image"
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleImageChange}
              />
              <button onClick={deleteAvatar}>Delete Avatar</button>
            </div> :
            <Avatar avatar_url={url}/>
        }
      </>
    )
  }

  const AccountDetail = ({title, value}: {
    title: any,
    value: any,
  }) => {
    const [editValue, setEditValue] = useState(value);
    return (
      <> 
        <label htmlFor={title}>{title}</label>
        {
          editing ? 
            <section>
              <input 
                name={title}
                id={title}
                value={editValue}
                onChange={(e: any) => setEditValue(e.target.value)}
                className="upload-input"
                required
              />
            </section> :
            <section>
              <input 
                value={value}
                disabled
                className="upload-input"
              />
            </section>
          } 
      </>
    )
  }

  return (
    <div className="upload-container">
      <h3>Account</h3>
      <form>
        <DisplayAvater url={user.avatar_url}/> <br/>
        <AccountDetail 
          title="Username"
          value={user.username}
        />
        <AccountDetail
          title="Name"
          value={user.full_name}
        />
        <AccountDetail
          title="Phone"
          value={user.phone}
        />
        <input type="hidden" name="uid" id="uid" value={user.id} />
        <input type="hidden" name="oldAvatarName" id="oldAvatarName" value={`${user.avatar_name}`} />
        {
          editing ? 
            <div className="edit-profile-buttons">
            <button onClick={toggleEditing}>
              Cancel Changes
            </button>
            <button formAction={updateProfile}>
              Submit Changes
            </button>
          </div> :
          <button onClick={toggleEditing}>Edit Profile</button>
        }
      </form>
    </div>
  )
}


/*---------------------
<UpdateAccount />
- update your username, profile picture, and password
---------------------*/

'use client'

import { useState } from "react";
import { updateProfile } from "@/app/components/actions";
import { Avatar } from "@/app/components/client-components";

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
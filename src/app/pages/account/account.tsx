'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { updateProfile, signout } from '@/app/components/actions';
import { Avatar } from '@/app/components/client-components';
import AccountNotificationToggle from './account-notification-toggle';

export function AccountCard({
  profile,
  displayName,
}: {
  profile: any;
  displayName: string;
}) {
  const [username, setUsername] = useState(profile?.username ?? '');
  const [editing, setEditing] = useState(false);
  const [deleteImage, setDeleteImage] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      setDeleteImage(false);
    }
  }

  function handleDeleteAvatar() {
    setDeleteImage(true);
    setAvatarPreview(null);
  }

  function handleRevertAvatar() {
    setDeleteImage(false);
    setAvatarPreview(profile?.avatar_url);
  }

  function confirmSignout() {
    if (window.confirm('Log out?')) signout();
  }

  const avatarSrc = deleteImage
    ? null
    : avatarPreview ?? profile?.avatar_url ?? null;

  useEffect(() => {
    console.log('editing clicked: ', editing)
    if(!editing) {
      handleRevertAvatar();
      setUsername(profile?.username)
    }
  }, [editing]);

  return (
    <div className="acct-card">
      <div className="acct-card__header">
        <h1 className="acct-card__title">Account Details</h1>
        <p className="acct-card__subtitle">
          Update your profile information and notification preference.
        </p>
      </div>

      <form onSubmit={(e) => { 
        e.preventDefault();
        setEditing(false);
        const formData = new FormData(e.currentTarget)
        updateProfile(formData);
      }}>
        <input type='hidden' name='uid' value={profile?.id} />
        <input type='hidden' name='prev-username' value={profile?.username} />
        <input type='hidden' name='prev-image' value={profile?.image_url} />
   
        <div className="acct-avatar-section">
          <div className="acct-avatar-wrap">
            <Avatar avatar_url={avatarSrc} />
            <label 
              className="acct-avatar-edit-btn" 
              title="Change avatar" 
              style={
                editing ? { } :
                {display: 'none'}
              }>
              ✎
              <input
                type="file"
                id='image'
                name="image"
                accept="image/png, image/jpeg"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
                disabled={!editing}
              />
            </label>
          </div>
          <div className="acct-avatar-name">{displayName}</div>
          {editing && (

              <button
                type="button"
                onClick={handleDeleteAvatar}
                style={{
                  marginTop: '0.35rem',
                  fontSize: '0.8rem',
                  color: '#b91c1c',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Remove avatar
              </button>
          )}
        </div>
      

        <div className='acct-field'>
          <label htmlFor='username' className='acct-field__label'>
            <Image
              src="/assets/account-page-username-icon.png"
              alt=""
              width={18}
              height={18}
              className="acct-field__label-icon"
            />
            Username
          </label>
          <input 
            id='username'
            name='username'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className='acct-field__input'
            disabled={!editing}
          />
        </div>

        { editing ? 
        <div className='edit-btns'> 
          <button onClick={() => setEditing(!editing)} className='acct-edit-btn'>Cancel Changes</button>
          <button type='submit' className='acct-save-btn'>Save Changes</button>
        </div> :
        <button onClick={() => setEditing(!editing)} className='acct-edit-btn'>Edit Profile</button>
        
        }

        <div className='acct-field'>
          <label className='acct-field__label'>
          <Image 
            src='/assets/orange-lock.svg'
            alt=''
            width={15}
            height={15}
            className='acct-field__label-icon'
          />

          
            Update Password
          </label>
          <div className='acct-field__row'>
            <input 
              name='text'
              id='text'
              value='Send a code to your email.'
              placeholder='Send a code to your email.' 
              className='acct-field__input'
              disabled
            />
            <button className='acct-edit-btn'>
              Send
            </button>
          </div>
        </div>
      </form>

      {/* Notification toggle */}
      <AccountNotificationToggle />

      {/* Sign out */}
      <div className="acct-signout">
        <button
          type="button"
          className="acct-signout-btn"
          onClick={confirmSignout}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}

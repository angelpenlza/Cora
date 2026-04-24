'use client';

import { useState } from 'react';
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
  const [saving, setSaving] = useState(false);

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

  function confirmSignout() {
    if (window.confirm('Log out?')) signout();
  }

  const avatarSrc = deleteImage
    ? null
    : avatarPreview ?? profile?.avatar_url ?? null;

  return (
    <div className="acct-card">
      <div className="acct-card__header">
        <h1 className="acct-card__title">Account Details</h1>
        <p className="acct-card__subtitle">
          Update your profile information and notification preference.
        </p>
      </div>

      <form onSubmit={(e) => { if (!saving) e.preventDefault(); }}>
        <input type="hidden" name="uid" value={profile?.id ?? ''} />
        <input
          type="hidden"
          name="oldAvatarName"
          value={profile?.avatar_name ?? ''}
        />
        {deleteImage && <input type="hidden" name="removeAvatar" value="1" />}

        {/* Avatar — pencil always opens file picker in one click */}
        <div className="acct-avatar-section">
          <div className="acct-avatar-wrap">
            <Avatar avatar_url={avatarSrc} />
            <label className="acct-avatar-edit-btn" title="Change avatar">
              ✎
              <input
                type="file"
                name="image"
                accept="image/png, image/jpeg"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <div className="acct-avatar-name">{displayName}</div>
          {avatarPreview && (
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

        {/* Username */}
        <div className="acct-field">
          <label className="acct-field__label">
            <img
              src="/assets/account-page-username-icon.png"
              alt=""
              className="acct-field__label-icon"
            />
            Username
          </label>
          <div className="acct-field__row">
            <input
              name="Username"
              className="acct-field__input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!editing}
              placeholder="New Username"
            />
            {editing ? (
              <button
                formAction={updateProfile}
                className="acct-save-btn"
                onClick={() => setSaving(true)}
              >
                Save
              </button>
            ) : (
              <button
                type="button"
                className="acct-edit-btn"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Hidden full_name field so the existing server action still gets a value */}
        <input
          type="hidden"
          name="Name"
          value={profile?.full_name ?? displayName}
        />
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

import { useState } from 'react';
import Sidebar from '../Sidebar';
import {
  useSellerProfile,
  useUpdateSellerProfile,
  useUpdateCurrentUser,
} from '../../../hooks/useUser';
import { useCurrentUser } from '../../../hooks/useAuth';
import { getUserInitials, getFirstName } from '../../../lib/user';
import '../seller-dashboard.css';
import './settings.css';

function SellerProfile() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const { data: profile, isLoading, error } = useSellerProfile();
  const { data: user } = useCurrentUser();
  const updateProfile = useUpdateSellerProfile();
  const updateAccount = useUpdateCurrentUser();
  const [serverError, setServerError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setServerError(null);
    const formData = new FormData(e.target);

    const profileData = {
      storeName: formData.get('storeName') || undefined,
      phone: formData.get('phone') || undefined,
      level: formData.get('level') || undefined,
      department: formData.get('department') || undefined,
      course: formData.get('course') || undefined,
      school: formData.get('school') || undefined,
      bio: formData.get('bio') || undefined,
    };
    const fullName = String(formData.get('fullName') ?? '').trim();
    const accountData = fullName && fullName !== user?.fullName ? { fullName } : null;

    try {
      // Save both the seller profile and (if changed) the account name.
      await Promise.all([
        updateProfile.mutateAsync(profileData),
        accountData ? updateAccount.mutateAsync(accountData) : Promise.resolve(null),
      ]);
      setEditing(false);
    } catch (err) {
      setServerError(err?.message || 'Failed to save profile.');
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  if (isLoading) {
    return (<><Sidebar active="profile" variant="profile" mobileOpen={menuOpen} onMobileClose={() => setMenuOpen(false)} /><div className="sd-main"><div className="sp-canvas"><p>Loading profile…</p></div></div></>);
  }
  if (error) {
    return (<><Sidebar active="profile" variant="profile" mobileOpen={menuOpen} onMobileClose={() => setMenuOpen(false)} /><div className="sd-main"><div className="sp-canvas"><p>Error loading profile: {error.message}</p></div></div></>);
  }

  return (
    <>
      <Sidebar active="profile" variant="profile" mobileOpen={menuOpen} onMobileClose={() => setMenuOpen(false)} />
      <div className="sd-main">
        <header className="sd-topbar">
          <div className="sd-topbar-left">
            <button className="sd-topbar-menu" aria-label="Open menu" onClick={() => setMenuOpen(true)}><span className="material-symbols-outlined">menu</span></button>
            <h2 className="sp-title">Seller Dashboard</h2>
          </div>
                              <div className="sd-topbar-actions">
            <div className="sp-search"><span className="material-symbols-outlined">search</span><input type="text" placeholder="Search..." /></div>
            <button className="sd-icon-btn" aria-label="Notifications"><span className="material-symbols-outlined">notifications</span></button>
            <div className="sd-avatar-sm ws-avatar-initials" title={user?.fullName}>
              {getUserInitials(user?.fullName)}
              <span className="sd-avatar-name">Hi, {getFirstName(user?.fullName)}</span>
            </div>
          </div>
        </header>
        <main className="sp-canvas">
          <div className="sp-inner">
            <div className="sp-heading">
              <h1 className="sp-heading-title">Account Settings</h1>
              <p className="sp-heading-sub">Manage your seller profile and contact information.</p>
            </div>
            {serverError && <div style={{ padding: "12px 16px", borderRadius: "12px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: "0.875rem", marginBottom: "16px" }}>{serverError}</div>}
            {updateProfile.isSuccess && <div style={{ padding: "12px 16px", borderRadius: "12px", background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#16A34A", fontSize: "0.875rem", marginBottom: "16px" }}>Profile saved successfully.</div>}
            <div className="sp-card">
              {/* Account summary — real session data (read-only) */}
              <div className="sp-card-head">
                <div className="sp-card-head-left">
                  <div className="sp-avatar-circle"><span style={{ fontWeight: 700 }}>{getUserInitials(user?.fullName)}</span></div>
                  <div>
                    <h3 className="sp-card-title">{user?.fullName ?? 'Loading…'}</h3>
                    <p className="sp-card-sub">
                      {user?.email}
                      {memberSince ? ` · Member since ${memberSince}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="sp-edit-btn"
                  onClick={() => setEditing((v) => !v)}
                >
                  <span className="material-symbols-outlined">{editing ? 'close' : 'edit'}</span>
                  {editing ? 'CANCEL' : 'EDIT'}
                </button>
              </div>
              <form className="sp-card-body" onSubmit={handleSave}>
                <div className="sp-grid">
                  <div className="sp-field">
                    <label className="sp-label" htmlFor="profileFullName">Full Name</label>
                    <input
                      className="sp-input"
                      id="profileFullName"
                      name="fullName"
                      type="text"
                      defaultValue={user?.fullName ?? ''}
                      placeholder="Your full name"
                      disabled={!editing}
                    />
                  </div>
                  <div className="sp-field">
                    <label className="sp-label" htmlFor="profileEmail">Email (read-only)</label>
                    <input
                      className="sp-input"
                      id="profileEmail"
                      type="email"
                      value={user?.email ?? ''}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="sp-field">
                    <label className="sp-label" htmlFor="profileStoreName">Store Name</label>
                    <input className="sp-input" id="profileStoreName" name="storeName" type="text" defaultValue={profile?.storeName ?? ''} placeholder="Your store name" disabled={!editing} />
                  </div>
                  <div className="sp-field">
                    <label className="sp-label" htmlFor="profilePhone">Phone Number</label>
                    <input className="sp-input" id="profilePhone" name="phone" type="text" defaultValue={profile?.phone ?? ''} placeholder="Your phone number" disabled={!editing} />
                  </div>
                  <div className="sp-field">
                    <label className="sp-label" htmlFor="profileLevel">Level</label>
                    <input className="sp-input" id="profileLevel" name="level" type="text" defaultValue={profile?.level ?? ''} placeholder="e.g. 400" disabled={!editing} />
                  </div>
                  <div className="sp-field">
                    <label className="sp-label" htmlFor="profileDepartment">Department</label>
                    <input className="sp-input" id="profileDepartment" name="department" type="text" defaultValue={profile?.department ?? ''} placeholder="Your department" disabled={!editing} />
                  </div>
                  <div className="sp-field">
                    <label className="sp-label" htmlFor="profileCourse">Course of Study</label>
                    <input className="sp-input" id="profileCourse" name="course" type="text" defaultValue={profile?.course ?? ''} placeholder="Your course of study" disabled={!editing} />
                  </div>
                  <div className="sp-field">
                    <label className="sp-label" htmlFor="profileSchool">School</label>
                    <input className="sp-input" id="profileSchool" name="school" type="text" defaultValue={profile?.school ?? ''} placeholder="Your school" disabled={!editing} />
                  </div>
                  <div className="sp-field sp-field-full">
                    <label className="sp-label" htmlFor="profileBio">Bio</label>
                    <textarea className="sp-textarea" id="profileBio" name="bio" rows="3" defaultValue={profile?.bio ?? ''} placeholder="Tell buyers about your store" disabled={!editing} />
                  </div>
                </div>
                <div className="sp-card-foot">
                  <button
                    type="submit"
                    className="sp-done-btn"
                    disabled={!editing || updateProfile.isPending || updateAccount.isPending}
                  >
                    {updateProfile.isPending || updateAccount.isPending ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
            <div className="sp-card sp-contact">
              <div className="sp-contact-head">
                <h3 className="sp-contact-title"><span className="material-symbols-outlined">support_agent</span>Contact Us</h3>
                <p className="sp-contact-sub">Need help with your seller account? Reach out to support.</p>
              </div>
              <div className="sp-contact-grid">
                <div className="sp-contact-item">
                  <div className="sp-contact-icon"><span className="material-symbols-outlined">call</span></div>
                  <div><p className="sp-contact-label">Phone No.</p><p className="sp-contact-value">07051917468</p></div>
                </div>
                <div className="sp-contact-item">
                  <div className="sp-contact-icon"><span className="material-symbols-outlined">mail</span></div>
                  <div><p className="sp-contact-label">Email</p><p className="sp-contact-value">universe26@gmail.com</p></div>
                </div>
              </div>
              <div className="sp-contact-wa-wrap">
                <a className="sp-contact-wa" href="https://wa.me/2347051917468" target="_blank" rel="noopener noreferrer">
                  <svg className="sp-contact-wa-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                  Contact On WhatsApp
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default SellerProfile;
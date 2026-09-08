import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../Sidebar';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useCurrentUser, useLogout } from '../../../hooks/useAuth';
import { useSellerProfile, useUpdateSellerProfile } from '../../../hooks/useUser';
import {
  useChangePassword,
  useDeleteAccount,
  useUpdateEmail,
} from '../../../hooks/useUser';
import { getUserInitials, getStoreDisplayName } from '../../../lib/user';
import { getPrettyStoreDomain, slugifyStoreName } from '../../../lib/storeDomain';
import { fileToCompressedDataUrl } from '../../../lib/image';
import '../seller-dashboard.css';
import './seller-settings.css';
import '../ui/widgets.css';

const ICON_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  viewBox: '0 0 24 24',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 2,
};

/** Heroicons outlines used by seller_settings.html */
const CogIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UserIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const BriefcaseIcon = (props) => (
  <svg {...ICON_PROPS} {...props}>
    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const MailIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const DocumentIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ShieldIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const LogoutIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const ChevronIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);

const BellIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const MenuIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const SETTINGS_ITEMS = [
  {
    key: 'profile',
    to: '/seller/profile',
    icon: <UserIcon />,
    title: 'Seller Profile',
    desc: 'Update your store details and personal info',
  },
  {
    key: 'password',
    icon: <ShieldIcon />,
    title: 'Change Password',
    desc: 'Use a strong, unique password — other sessions stay secure',
  },
  {
    key: 'email',
    icon: <MailIcon />,
    title: 'Update Email',
    desc: 'Change the email address you sign in with',
  },
  {
    key: 'contact',
    href: 'mailto:universe26@gmail.com',
    icon: <BriefcaseIcon />,
    title: 'Contact Us',
    desc: 'Get help from our support team',
  },
  {
    key: 'terms',
    icon: <DocumentIcon />,
    title: 'Terms of Service',
    desc: 'Read our rules and guidelines',
  },
  {
    key: 'privacy',
    icon: <ExternalLinkIcon />,
    title: 'Privacy Policy',
    desc: 'How we handle your data',
  },
];

/**
 * Seller Settings hub — port of seller_settings.html.
 * /seller/settings
 *
 * Every action is real: password change, email change and account deletion go
 * through the API (all password-confirmed server-side); logout ends the
 * session; Terms/Privacy open their content inline.
 */
function SellerSettings() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'password' | 'email' | 'terms' | 'privacy' | 'delete'
  const [deletePassword, setDeletePassword] = useState('');
  const closeMenu = () => setMenuOpen(false);

  const { data: user } = useCurrentUser();
  const { data: profile } = useSellerProfile();
  const logout = useLogout();
  const deleteAccount = useDeleteAccount();

  // The seller's private-marketplace domain: storename.<app-domain>.
  const storeSlug = slugifyStoreName(getStoreDisplayName(profile?.storeName, user?.fullName));
  const storeDomain = getPrettyStoreDomain(storeSlug);
  const [domainCopied, setDomainCopied] = useState(false);
  const copyStoreDomain = async () => {
    try {
      await navigator.clipboard.writeText(`https://${storeDomain}`);
      setDomainCopied(true);
      setTimeout(() => setDomainCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the address stays visible either way */
    }
  };

  // ---- Store branding: logo + cover picture shown on the private marketplace.
  const updateProfile = useUpdateSellerProfile();
  const [branding, setBranding] = useState({ logoUrl: '', bannerUrl: '' });
  const [brandingDirty, setBrandingDirty] = useState(false);
  const [brandingBusy, setBrandingBusy] = useState(false);
  const [brandingError, setBrandingError] = useState('');
  const [brandingSaved, setBrandingSaved] = useState(false);

  // Hydrate the editors once the profile loads (unless the user already edited).
  useEffect(() => {
    if (profile && !brandingDirty) {
      setBranding({ logoUrl: profile.logoUrl || '', bannerUrl: profile.bannerUrl || '' });
    }
  }, [profile, brandingDirty]);

  // Toast feedback — fires when the logo/cover upload is saved successfully.
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = (message, icon = 'check_circle') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, icon, show: true });
    toastTimer.current = setTimeout(() => {
      setToast((current) => (current ? { ...current, show: false } : current));
    }, 3000);
  };

  const BRANDING_PARAMS = {
    logo: { maxDim: 512, quality: 0.85 },
    banner: { maxDim: 1200, quality: 0.8 },
  };

  const setBrandingImage = async (kind, file) => {
    if (!file) return;
    setBrandingError('');
    try {
      const dataUrl = await fileToCompressedDataUrl(file, BRANDING_PARAMS[kind]);
      setBranding((current) => ({ ...current, [kind === 'logo' ? 'logoUrl' : 'bannerUrl']: dataUrl }));
      setBrandingDirty(true);
      setBrandingSaved(false);
    } catch (err) {
      setBrandingError(err?.message || 'Could not process that image.');
    }
  };

  const clearBrandingImage = (kind) => {
    setBranding((current) => ({ ...current, [kind === 'logo' ? 'logoUrl' : 'bannerUrl']: '' }));
    setBrandingDirty(true);
    setBrandingSaved(false);
  };

  const saveBranding = async () => {
    setBrandingError('');
    setBrandingBusy(true);
    try {
      await updateProfile.mutateAsync({
        logoUrl: branding.logoUrl || null,
        bannerUrl: branding.bannerUrl || null,
      });
      setBrandingDirty(false);
      setBrandingSaved(true);
      showToast('Upload successful — your storefront branding has been updated!', 'check_circle');
      setTimeout(() => setBrandingSaved(false), 2500);
    } catch (err) {
      setBrandingError(err?.message || 'Could not save your branding.');
    } finally {
      setBrandingBusy(false);
    }
  };

  const openModal = (key) => setActiveModal(key);
  const closeModal = () => setActiveModal(null);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <>
      <Sidebar active="settings" mobileOpen={menuOpen} onMobileClose={closeMenu} />

      <div className="sd-main st-root">
        {/* TopAppBar */}
        <header className="st-topbar">
          <div className="st-topbar-left">
            <button className="st-topbar-hamburger" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <MenuIcon />
            </button>
            <h2 className="st-topbar-title">Settings</h2>
          </div>
          <div className="st-topbar-actions">
            <button className="st-bell" aria-label="Notifications">
              <BellIcon />
            </button>
            <div className="st-avatar" title={user?.fullName}>{getUserInitials(user?.fullName)}</div>
          </div>
        </header>

        {/* Main Content */}
        <main className="st-canvas">
          <div className="st-container">
            {/* Header Section */}
            <div className="st-head">
              <div className="st-head-icon">
                <CogIcon />
              </div>
              <div>
                <h1 className="st-head-title">Account Settings</h1>
                <p className="st-head-sub">Manage your preferences and configurations.</p>
              </div>
            </div>

            {/* Signed-in account summary — real session data */}
            <div className="st-account-card">
              <span className="sd-user-avatar st-account-avatar" aria-hidden="true">
                {getUserInitials(user?.fullName)}
              </span>
              <div>
                <p className="st-account-name">{user?.fullName ?? 'Loading…'}</p>
                <p className="st-account-email">{user?.email ?? ''}</p>
                <span className="st-account-badge">
                  {user?.accountType === 'seller' ? 'Seller account' : 'Buyer account'}
                </span>
              </div>
              {memberSince && <div className="st-account-since">Member since {memberSince}</div>}
            </div>

            {/* Private marketplace domain — storename.<app-domain> */}
            <div className="st-card st-domain-card">
              <div className="st-card-head">
                <span className="st-card-icon">
                  <span className="material-symbols-outlined">language</span>
                </span>
                <div className="st-card-heading">
                  <p className="st-card-title">Private Marketplace Domain</p>
                  <p className="st-card-desc">
                    Your storefront lives at this address — it follows your store name (edit it in Seller Profile).
                  </p>
                </div>
              </div>
              <div className="st-domain-chip">
                <span className="material-symbols-outlined">link</span>
                {storeDomain}
              </div>
              <div className="st-card-actions">
                <button type="button" className="st-btn" onClick={copyStoreDomain}>
                  <span className="material-symbols-outlined">{domainCopied ? 'check' : 'content_copy'}</span>
                  {domainCopied ? 'Copied' : 'Copy Link'}
                </button>
                <Link className="st-btn st-btn-primary" to={`/store/${storeSlug}`}>
                  <span className="material-symbols-outlined">open_in_new</span>
                  Open Storefront
                </Link>
              </div>
            </div>

            {/* Store branding — logo + cover picture for the private marketplace */}
            <div className="st-card st-brand-card">
              <div className="st-card-head">
                <span className="st-card-icon">
                  <span className="material-symbols-outlined">brush</span>
                </span>
                <div className="st-card-heading">
                  <p className="st-card-title">Store Branding</p>
                  <p className="st-card-desc">
                    Your logo and cover picture appear on your private marketplace storefront.
                  </p>
                </div>
              </div>
              <div className="st-brand-slots">
                {/* Logo slot */}
                <div className="st-brand-slot">
                  <span className="st-brand-label">Store Logo</span>
                  <label className="st-brand-upload st-brand-upload-square" htmlFor="brand-logo-input" title="Upload logo">
                    {branding.logoUrl ? (
                      <img className="st-brand-preview" src={branding.logoUrl} alt="Store logo preview" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined">add_a_photo</span>
                        <span className="st-brand-upload-hint">Upload logo</span>
                      </>
                    )}
                  </label>
                  <input
                    id="brand-logo-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(event) => {
                      setBrandingImage('logo', event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                  {branding.logoUrl && (
                    <button type="button" className="st-brand-remove" onClick={() => clearBrandingImage('logo')}>
                      Remove
                    </button>
                  )}
                </div>
                {/* Cover picture slot */}
                <div className="st-brand-slot st-brand-slot-wide">
                  <span className="st-brand-label">Cover Picture</span>
                  <label className="st-brand-upload st-brand-upload-wide" htmlFor="brand-cover-input" title="Upload cover picture">
                    {branding.bannerUrl ? (
                      <img className="st-brand-preview" src={branding.bannerUrl} alt="Cover picture preview" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined">panorama</span>
                        <span className="st-brand-upload-hint">Upload cover picture</span>
                      </>
                    )}
                  </label>
                  <input
                    id="brand-cover-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(event) => {
                      setBrandingImage('banner', event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                  {branding.bannerUrl && (
                    <button type="button" className="st-brand-remove" onClick={() => clearBrandingImage('banner')}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {brandingError && (
                <p className="st-brand-error" role="alert">{brandingError}</p>
              )}
              <div className="st-card-foot">
                <button
                  type="button"
                  className="st-btn st-btn-primary"
                  onClick={saveBranding}
                  disabled={brandingBusy || !brandingDirty}
                >
                  <span className="material-symbols-outlined">{brandingSaved ? 'check' : 'save'}</span>
                  {brandingBusy ? 'Saving…' : brandingSaved ? 'Saved' : 'Save Branding'}
                </button>
                <span className="st-brand-savehint">
                  Compressed automatically in your browser — applies to your storefront instantly.
                </span>
              </div>
            </div>

            {/* Settings List */}
            <div className="st-list">
              <ul>
                {SETTINGS_ITEMS.map((item) => (
                  <li key={item.key}>
                    {item.to ? (
                      <Link to={item.to} className="st-item">
                        <div className="st-item-left">
                          <span className="st-item-icon">{item.icon}</span>
                          <div>
                            <h3 className="st-item-title">{item.title}</h3>
                            <p className="st-item-desc">{item.desc}</p>
                          </div>
                        </div>
                        <span className="st-item-chevron">
                          <ChevronIcon />
                        </span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="st-item"
                        style={{ width: '100%', background: 'none', border: 0, font: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                        onClick={() => openModal(item.key)}
                      >
                        <div className="st-item-left">
                          <span className="st-item-icon">{item.icon}</span>
                          <div>
                            <h3 className="st-item-title">{item.title}</h3>
                            <p className="st-item-desc">{item.desc}</p>
                          </div>
                        </div>
                        <span className="st-item-chevron">
                          <ChevronIcon />
                        </span>
                      </button>
                    )}
                  </li>
                ))}

                {/* Logout (distinct visually) — fully working */}
                <li>
                  <button className="st-item st-item-logout" type="button" onClick={() => logout.mutate()} disabled={logout.isPending}>
                    <div className="st-item-left">
                      <span className="st-item-icon">
                        <LogoutIcon />
                      </span>
                      <div>
                        <h3 className="st-logout-title">{logout.isPending ? 'Logging out…' : 'Logout'}</h3>
                      </div>
                    </div>
                  </button>
                </li>
              </ul>
            </div>

            {/* Danger Zone — permanent account deletion */}
            <div className="st-danger-card">
              <h3 className="st-danger-title">
                <span className="material-symbols-outlined">dangerous</span>
                Danger Zone
              </h3>
              <p className="st-danger-desc">
                Permanently delete your account, along with your products, store profile and all
                sessions. This action cannot be undone — download anything you want to keep first.
              </p>
              <button type="button" className="sd-btn sd-btn-danger" onClick={() => openModal('delete')}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_forever</span>
                Delete My Account
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ---- Modals ---- */}
      {activeModal === 'password' && <ChangePasswordModal onClose={closeModal} />}
      {activeModal === 'email' && <UpdateEmailModal onClose={closeModal} />}

      {activeModal === 'terms' && (
        <InfoModal title="Terms of Service" onClose={closeModal}>
          <p><strong>1. Selling on Universe.</strong> Sellers are responsible for the accuracy of their listings, the quality of their products and timely fulfilment of orders.</p>
          <p><strong>2. Prohibited items.</strong> Counterfeit goods, illegal items and anything that violates another person's rights may not be listed.</p>
          <p><strong>3. Payouts.</strong> Sale proceeds are held until the order is confirmed delivered, then released to your payout method.</p>
          <p><strong>4. Account security.</strong> Keep your password confidential. You are responsible for activity that happens under your account.</p>
          <p><strong>5. Termination.</strong> Accounts that repeatedly violate these terms may be suspended.</p>
          <p style={{ color: 'var(--color-primary)' }}>
            <Link to="/terms" style={{ fontWeight: 600, textDecoration: 'none', color: 'var(--color-primary)' }}>
              Read the full Terms of Service →
            </Link>
          </p>
        </InfoModal>
      )}

      {activeModal === 'privacy' && (
        <InfoModal title="Privacy Policy" onClose={closeModal}>
          <p><strong>What we store.</strong> Your name, email, store profile and the products you publish. Passwords are stored only as salted PBKDF2 hashes — never in plain text.</p>
          <p><strong>What we never share.</strong> Your personal details and your draft products are private. Other users only ever see your public store information and published listings.</p>
          <p><strong>Sessions.</strong> Sessions are scoped to your browser. Logging out revokes your tokens; changing your password revokes every other device's session.</p>
          <p><strong>Deletion.</strong> Deleting your account permanently removes your products, profile and personal data.</p>
        </InfoModal>
      )}

      <ConfirmDialog
        open={activeModal === 'delete'}
        title="Delete your account?"
        message="This permanently removes your account, every product you own, your store profile and all sessions. There is no way back."
        requireText="DELETE"
        confirmLabel="Delete forever"
        busy={deleteAccount.isPending}
        onConfirm={() => deleteAccount.mutate({ currentPassword: deletePassword })}
        onCancel={closeModal}
      >
        <div className="sd-field">
          <label htmlFor="delete-current-password">Current password</label>
          <input
            id="delete-current-password"
            type="password"
            autoComplete="current-password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Confirm your password"
          />
          {deleteAccount.isError && (
            <p className="sd-field-error">{deleteAccount.error?.message ?? 'Deletion failed.'}</p>
          )}
        </div>
      </ConfirmDialog>

      {/* Toast — successful branding upload feedback */}
      <div className={toast?.show ? 'st-toast show' : 'st-toast'} role="status" aria-live="polite">
        <span className="material-symbols-outlined st-toast-icon">{toast?.icon ?? 'check_circle'}</span>
        <span className="st-toast-msg">{toast?.message ?? ''}</span>
      </div>
    </>
  );
}

/** Modal with a simple body — used for Terms and Privacy content. */
function InfoModal({ title, onClose, children }) {
  return (
    <div
      className="sd-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sd-modal">
        <h2 className="sd-modal-title">{title}</h2>
        <div style={{ display: 'grid', gap: 10, fontSize: '0.86rem', color: '#475569', lineHeight: 1.55 }}>
          {children}
        </div>
        <div className="sd-modal-actions">
          <button type="button" className="sd-btn sd-btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** Change-password dialog — posts to PATCH /users/me/password. */
function ChangePasswordModal({ onClose }) {
  const changePassword = useChangePassword();
  const [fields, setFields] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError(null);
    if (fields.newPassword !== fields.confirm) {
      setError('New passwords do not match.');
      return;
    }
    changePassword.mutate(
      { currentPassword: fields.currentPassword, newPassword: fields.newPassword },
      {
        onSuccess: () => setSuccess(true),
        onError: (err) => {
          const fieldMsg = err?.fieldErrors && Object.values(err.fieldErrors)[0];
          setError(fieldMsg || err.message || 'Could not change your password.');
        },
      },
    );
  };

  return (
    <div
      className="sd-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Change password"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !changePassword.isPending) onClose();
      }}
    >
      <div className="sd-modal">
        <h2 className="sd-modal-title">Change Password</h2>
        {success ? (
          <>
            <div className="sd-form-success">
              Password changed. Every other signed-in device has been logged out.
            </div>
            <div className="sd-modal-actions">
              <button type="button" className="sd-btn sd-btn-primary" onClick={onClose}>Done</button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            {error && <div className="sd-form-error">{error}</div>}
            <div className="sd-field">
              <label htmlFor="pw-current">Current password</label>
              <input id="pw-current" type="password" autoComplete="current-password" value={fields.currentPassword} onChange={set('currentPassword')} />
            </div>
            <div className="sd-field">
              <label htmlFor="pw-new">New password</label>
              <input id="pw-new" type="password" autoComplete="new-password" value={fields.newPassword} onChange={set('newPassword')} />
            </div>
            <div className="sd-field">
              <label htmlFor="pw-confirm">Confirm new password</label>
              <input id="pw-confirm" type="password" autoComplete="new-password" value={fields.confirm} onChange={set('confirm')} />
            </div>
            <div className="sd-modal-actions">
              <button type="button" className="sd-btn sd-btn-ghost" onClick={onClose} disabled={changePassword.isPending}>
                Cancel
              </button>
              <button type="submit" className="sd-btn sd-btn-primary" disabled={changePassword.isPending}>
                {changePassword.isPending ? 'Saving…' : 'Change password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/** Update-email dialog — posts to POST /users/me/email (password-confirmed). */
function UpdateEmailModal({ onClose }) {
  const updateEmail = useUpdateEmail();
  const [fields, setFields] = useState({ currentPassword: '', newEmail: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setError(null);
    updateEmail.mutate(
      { currentPassword: fields.currentPassword, newEmail: fields.newEmail },
      {
        onSuccess: () => setSuccess(true),
        onError: (err) => {
          const fieldMsg = err?.fieldErrors && Object.values(err.fieldErrors)[0];
          setError(fieldMsg || err.message || 'Could not update your email.');
        },
      },
    );
  };

  return (
    <div
      className="sd-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Update email"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !updateEmail.isPending) onClose();
      }}
    >
      <div className="sd-modal">
        <h2 className="sd-modal-title">Update Email</h2>
        {success ? (
          <>
            <div className="sd-form-success">Email updated. Use your new email next time you sign in.</div>
            <div className="sd-modal-actions">
              <button type="button" className="sd-btn sd-btn-primary" onClick={onClose}>Done</button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            {error && <div className="sd-form-error">{error}</div>}
            <div className="sd-field">
              <label htmlFor="email-current-password">Current password</label>
              <input
                id="email-current-password"
                type="password"
                autoComplete="current-password"
                value={fields.currentPassword}
                onChange={(e) => setFields((f) => ({ ...f, currentPassword: e.target.value }))}
              />
            </div>
            <div className="sd-field">
              <label htmlFor="email-new">New email address</label>
              <input
                id="email-new"
                type="email"
                autoComplete="email"
                value={fields.newEmail}
                onChange={(e) => setFields((f) => ({ ...f, newEmail: e.target.value }))}
              />
            </div>
            <div className="sd-modal-actions">
              <button type="button" className="sd-btn sd-btn-ghost" onClick={onClose} disabled={updateEmail.isPending}>
                Cancel
              </button>
              <button type="submit" className="sd-btn sd-btn-primary" disabled={updateEmail.isPending}>
                {updateEmail.isPending ? 'Saving…' : 'Update email'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default SellerSettings;

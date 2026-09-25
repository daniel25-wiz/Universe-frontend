import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../../hooks/useAuth';
import { useUpdateCurrentUser } from '../../hooks/useUser';
import { getUserInitials } from '../../lib/user';
import { SUPPORT_WHATSAPP_NUMBER } from '../../lib/support';
import { loadBuyerExtras, saveBuyerExtras } from '../../lib/buyerProfile';
import './buyer-profile.css';
/* Same inline-SVG Material icon set the seller dashboard renders its
   "Contact Us" section with (see SellerProfile.jsx). */
import MaterialIcon from '../ui/MaterialIcon';

/* Support desk details — same contact surface as the seller profile. */
const SUPPORT_PHONE_DISPLAY = '07051917468';
const SUPPORT_PHONE_TEL = `tel:${SUPPORT_PHONE_DISPLAY}`;
const SUPPORT_EMAIL = 'universe26@gmail.com';
const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`;

/** Total number of product units across the buyer's order history. */
function countOrderedItems(orders) {
  if (!Array.isArray(orders)) return 0;
  return orders.reduce((total, order) => {
    if (Array.isArray(order?.items) && order.items.length > 0) {
      return total + order.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    }
    return total + 1; // legacy/local snapshot without line items
  }, 0);
}

/** "2026-09-12T..." -> "Sep 2026" for the "Member since" line. */
function formatMemberSince(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Buyer Profile page — the React implementation of
 * buyer_profile_streamlined.html, wired to the app's API service layer so it
 * behaves identically in mock and real API modes:
 *
 * - Account data (name, email, avatar, member since) comes from
 *   useCurrentUser() -> authApi.getCurrentUser().
 * - "Save" persists the full name through usersApi.updateCurrentUser()
 *   (PATCH /users/me in both backends). Level / department / school are not
 *   part of the Users API contract, so they persist client-side
 *   (see lib/buyerProfile).
 * - Activity stats read the same cart / saved / orders state the rest of the
 *   marketplace uses (passed down from App).
 * - Log Out goes through authApi.logout() via useLogout().
 */
function BuyerProfile({ cartItems = [], savedProducts = [], orders = [] }) {
  const navigate = useNavigate();
  const { data: user, isLoading, isError } = useCurrentUser();
  const updateAccount = useUpdateCurrentUser();
  const logout = useLogout();
  const formRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [saveState, setSaveState] = useState(null); // null | 'ok' | { error }
  // Avatar URLs (e.g. Google profile pictures) can fail to load — remember the
  // last broken URL so the initials badge takes over instead of a broken image.
  const [brokenAvatarUrl, setBrokenAvatarUrl] = useState(null);

  const initials = getUserInitials(user?.fullName);
  const memberSince = formatMemberSince(user?.createdAt);
  const savedCount = Array.isArray(savedProducts) ? savedProducts.length : 0;
  const orderedCount = countOrderedItems(orders);
  const cartCount = (Array.isArray(cartItems) ? cartItems : []).reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0,
  );

  const startEditing = () => {
    setSaveState(null);
    // Seed the local-only academic fields from storage right before editing so
    // changes made elsewhere (or before a reload) are always reflected.
    const extras = loadBuyerExtras();
    const form = formRef.current;
    if (form) {
      form.elements.level.value = extras.level;
      form.elements.department.value = extras.department;
      form.elements.school.value = extras.school;
    }
    setEditing(true);
  };

  const handleSave = async () => {
    const form = formRef.current;
    if (!form) return;

    const fullName = String(form.elements.fullName.value ?? '').trim();
    const extras = {
      level: String(form.elements.level.value ?? '').trim(),
      department: String(form.elements.department.value ?? '').trim(),
      school: String(form.elements.school.value ?? '').trim(),
    };

    setSaveState(null);
    try {
      if (fullName && fullName !== user?.fullName) {
        await updateAccount.mutateAsync({ fullName });
      }
      saveBuyerExtras(extras);
      setEditing(false);
      setSaveState('ok');
    } catch (error) {
      setSaveState({ error: error?.message || 'Failed to save your profile.' });
    }
  };

  const handleEditClick = () => (editing ? handleSave() : startEditing());
  const handleFormSubmit = (event) => {
    event.preventDefault();
    if (editing) handleSave();
  };
  const handleLogout = () => logout.mutate();

  const isSaving = updateAccount.isPending;
  const saveLabel = isSaving ? 'SAVING…' : editing ? 'SAVE' : 'EDIT';

  if (isLoading) {
    return (
      <div className="bp-page">
        <div className="bp-shell">
          <p className="bp-state">Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="bp-page">
        <div className="bp-shell">
          <p className="bp-state is-error">We couldn&apos;t load your profile. Please sign in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bp-page">
      <div className="bp-shell">
        {/* BEGIN: TopNavigation */}
        <header className="bp-topbar" data-purpose="app-header">
          <button aria-label="Back to marketplace" className="bp-menu-btn" type="button" onClick={() => navigate('/marketplace')}>
            <svg viewBox="0 0 24 24">
              <line x1="19" x2="5" y1="12" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div className="bp-topbar-actions">
            <button aria-label="Notifications" className="bp-bell" type="button">
              <svg viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="bp-bell-dot" />
            </button>
            <div className="bp-avatar-pill">
              <span>Hi, {initials}</span>
            </div>
          </div>
        </header>
        {/* END: TopNavigation */}

        <main className="bp-main">
          {/* BEGIN: PageHeading */}
          <section className="bp-title" data-purpose="page-title-section">
            <h1>Buyer Profile</h1>
            <p>Your student buyer account &amp; activity overview</p>
          </section>
          {/* END: PageHeading */}

          {/* BEGIN: BuyerProfileCard */}
          <section className="bp-card" data-purpose="buyer-profile-card">
            <div className="bp-card-head">
              <div className="bp-identity">
                <div className="bp-initials-badge">
                  {user.avatarUrl && user.avatarUrl !== brokenAvatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      onError={() => setBrokenAvatarUrl(user.avatarUrl)}
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div>
                  <div className="bp-name-row">
                    <h2>{user.fullName}</h2>
                    <span className="bp-verified-pill">Verified Buyer</span>
                  </div>
                  <p className="bp-identity-email">{user.email}</p>
                  {memberSince && (
                    <p className="bp-identity-since">
                      <span>•</span> Member since {memberSince}
                    </p>
                  )}
                </div>
              </div>
              <button
                className="bp-edit-btn"
                type="button"
                onClick={handleEditClick}
                disabled={isSaving}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
                <span>{saveLabel}</span>
              </button>
            </div>
            {/* Buyer Activity Stats */}
            <div className="bp-stats" data-purpose="buyer-summary-stats">
              <div className="bp-stat">
                <b>{savedCount}</b>
                <span>Saved Products</span>
              </div>
              <div className="bp-stat">
                <b>{orderedCount}</b>
                <span>Products Ordered</span>
              </div>
              <div className="bp-stat is-cart">
                <b>{cartCount}</b>
                <span>Items in Cart</span>
              </div>
            </div>
          </section>
          {/* END: BuyerProfileCard */}

          {/* BEGIN: BuyerDetailsForm */}
          <section className="bp-card" data-purpose="buyer-details-form">
            <form className="bp-form" ref={formRef} onSubmit={handleFormSubmit} noValidate>
              <div className="bp-field">
                <label htmlFor="fullName">Full Name</label>
                <input
                  className="bp-input"
                  id="fullName"
                  name="fullName"
                  type="text"
                  defaultValue={user.fullName}
                  placeholder="Your full name"
                  disabled={!editing}
                />
              </div>
              <div className="bp-field">
                <label htmlFor="level">Level</label>
                <input
                  className="bp-input"
                  id="level"
                  name="level"
                  type="text"
                  defaultValue={loadBuyerExtras().level}
                  placeholder="e.g. 200"
                  disabled={!editing}
                />
              </div>
              <div className="bp-field">
                <label htmlFor="department">Department</label>
                <input
                  className="bp-input"
                  id="department"
                  name="department"
                  type="text"
                  defaultValue={loadBuyerExtras().department}
                  placeholder="e.g. Computer Science"
                  disabled={!editing}
                />
              </div>
              <div className="bp-field">
                <label htmlFor="school">School</label>
                <input
                  className="bp-input"
                  id="school"
                  name="school"
                  type="text"
                  defaultValue={loadBuyerExtras().school}
                  placeholder="e.g. Olabisi Onabanjo University"
                  disabled={!editing}
                />
              </div>
              {saveState === 'ok' && (
                <p className="bp-form-feedback is-ok">Profile saved.</p>
              )}
              {saveState && typeof saveState === 'object' && saveState.error && (
                <p className="bp-form-feedback is-error">{saveState.error}</p>
              )}
            </form>
          </section>
          {/* END: BuyerDetailsForm */}

          {/* BEGIN: ContactUsSection — same icons and card styling as the
              seller profile's "Contact Us" card (SellerProfile.jsx +
              settings.css .sp-contact*): Material support_agent / call /
              mail glyphs in secondary-container tiles. */}
          <section className="bp-card bp-contact" data-purpose="support-card">
            <div className="bp-contact-head">
              <h2 className="bp-contact-title">
                <MaterialIcon name="support_agent" />Contact Us
              </h2>
              <p className="bp-contact-sub">
                Need help with your orders or purchases? Reach out to support.
              </p>
            </div>
            <div className="bp-contact-grid">
              {/* Phone Card — tap to call */}
              <a className="bp-contact-item" href={SUPPORT_PHONE_TEL}>
                <div className="bp-contact-icon"><MaterialIcon name="call" /></div>
                <div>
                  <p className="bp-contact-label">Phone No.</p>
                  <p className="bp-contact-value">{SUPPORT_PHONE_DISPLAY}</p>
                </div>
              </a>
              {/* Email Card — tap to compose */}
              <a className="bp-contact-item" href={`mailto:${SUPPORT_EMAIL}`}>
                <div className="bp-contact-icon"><MaterialIcon name="mail" /></div>
                <div>
                  <p className="bp-contact-label">Email</p>
                  <p className="bp-contact-value break-all">{SUPPORT_EMAIL}</p>
                </div>
              </a>
            </div>
            {/* WhatsApp Action Button */}
            <div className="bp-contact-wa-wrap">
              <a
                className="bp-whatsapp"
                href={SUPPORT_WHATSAPP_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                {/* Same official WhatsApp brand glyph as the seller profile button */}
                <svg className="bp-whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                <span>Contact On WhatsApp</span>
              </a>
            </div>
          </section>
          {/* END: ContactUsSection */}

          {/* Log Out Action Button */}
          <div className="bp-logout-wrap">
            <button
              className="bp-logout"
              type="button"
              onClick={handleLogout}
              disabled={logout.isPending}
            >
              <svg viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
              <span>{logout.isPending ? 'Logging Out…' : 'Log Out'}</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default BuyerProfile;


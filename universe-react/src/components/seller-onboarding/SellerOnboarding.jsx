import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useAuth';
import { useSellerProfile, useUpdateCurrentUser, useUpdateSellerProfile } from '../../hooks/useUser';
import './seller-onboarding.css';

const StoreIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18M5 10v10h14V10M4 10l1.5-6h13L20 10M8 10v3m4-3v3m4-3v3" /></svg>;
const UserIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></svg>;
const GlobeIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>;
const ChartIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5m0 14h16M8 16v-4m4 4V8m4 8V5" /></svg>;
const BoxIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4-8 4-8-4 8-4Zm-8 4v10l8 4 8-4V7M12 11v10" /></svg>;
const ArrowIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;

const initialFields = {
  storeName: '',
  fullName: '',
  phone: '',
  level: '',
  department: '',
  course: '',
  school: 'Olabisi Onabanjo University',
};

function SellerOnboarding() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: profile, isLoading } = useSellerProfile();
  const updateProfile = useUpdateSellerProfile();
  const updateUser = useUpdateCurrentUser();
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState(initialFields);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user || profile) {
      setFields((current) => ({
        ...current,
        fullName: user?.fullName || current.fullName,
        storeName: profile?.storeName || current.storeName,
        phone: profile?.phone || current.phone,
        level: profile?.level || current.level,
        department: profile?.department || current.department,
        course: profile?.course || current.course,
        school: profile?.school || current.school,
      }));
    }
  }, [user, profile]);

  const setField = (name) => (event) => setFields((current) => ({ ...current, [name]: event.target.value }));

  const saveStore = async (event) => {
    event.preventDefault();
    if (!fields.storeName.trim()) {
      setError('Enter a store or brand name to continue.');
      return;
    }
    setError('');
    try {
      await updateProfile.mutateAsync({ storeName: fields.storeName.trim() });
      setStep(2);
    } catch (err) {
      setError(err?.message || 'We could not save your store details.');
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!fields.fullName.trim() || !fields.phone.trim() || !fields.level || !fields.department.trim() || !fields.course.trim()) {
      setError('Complete the required profile fields to continue.');
      return;
    }
    setError('');
    try {
      await Promise.all([
        updateProfile.mutateAsync({
          storeName: fields.storeName.trim(),
          phone: fields.phone.trim(),
          level: fields.level,
          department: fields.department.trim(),
          course: fields.course.trim(),
          school: fields.school,
        }),
        updateUser.mutateAsync({ fullName: fields.fullName.trim() }),
      ]);
      setStep(3);
    } catch (err) {
      setError(err?.message || 'We could not save your profile.');
    }
  };

  const pending = updateProfile.isPending || updateUser.isPending;

  if (isLoading) return <div className="seller-onboarding-loading">Loading your setup...</div>;

  return (
    <div className="seller-onboarding">
      <header className="onboarding-header">
        <button className="onboarding-back" type="button" onClick={() => navigate('/seller')}><span aria-hidden="true">‹</span> <span>Back to Dashboard</span></button>
        <img className="onboarding-logo" src="/logo.png" alt="Universe" />
        <a href="mailto:support@universe.com" className="onboarding-support">Need help? <b>Support</b></a>
      </header>

      {step === 3 ? (
        <Milestones onContinue={() => navigate('/seller')} />
      ) : (
        <main className="setup-shell">
          <aside className="setup-steps" aria-label="Onboarding progress">
            <span className="eyebrow">MERCHANT SETUP</span>
            <h1>Create Your Store</h1>
            <div className="step-list">
              <Step number="1" active={step === 1} complete={step > 1} title="Store Setup" description="Name & brand definition" />
              <Step number="2" active={step === 2} title="Profile Setup" description="Personal details" />
              <Step number="3" title="Getting Started" description="Launch checklist" />
            </div>
          </aside>

          <section className="setup-form-panel">
            {step === 1 ? (
              <>
                <span className="step-label">STEP 1</span>
                <h2>Name of Setup</h2>
                <p className="setup-intro">Get a head start on your store setup in just a few minutes.</p>
                <form onSubmit={saveStore} className="setup-form">
                  <div className="setup-card">
                    <div className="setup-card-title"><span className="icon-badge"><StoreIcon /></span><div><h3>Setup</h3><p>What's your store name?</p></div></div>
                    <label htmlFor="store-name">STORE OR BRAND NAME <em>*</em></label>
                    <div className="input-with-icon"><StoreIcon /><input id="store-name" value={fields.storeName} onChange={setField('storeName')} placeholder="Enter the name of your store" autoFocus /></div>
                    <small>You can change or customize your public store URL at any time later in Settings.</small>
                  </div>
                  <ActionRow pending={pending} label="NEXT" />
                </form>
              </>
            ) : (
              <>
                <span className="step-label">STEP 2</span>
                <h2>Complete Your Profile</h2>
                <p className="setup-intro">Tell us more about your background to set up your merchant profile.</p>
                <form onSubmit={saveProfile} className="profile-form">
                  <div className="profile-card-header"><span className="profile-avatar"><UserIcon /></span><div><h3>Seller Profile</h3><p>Update your academic and personal details.</p></div></div>
                  <div className="profile-fields">
                    <Field label="Name" name="fullName" value={fields.fullName} onChange={setField('fullName')} placeholder="Enter your full name" />
                    <Field label="Phone No." name="phone" value={fields.phone} onChange={setField('phone')} placeholder="+234" type="tel" />
                    <label><span>Level</span><select name="level" value={fields.level} onChange={setField('level')}><option value="">Select Level</option>{['100', '200', '300', '400', '500'].map((level) => <option key={level} value={level}>{level} Level</option>)}</select></label>
                    <Field label="Department" name="department" value={fields.department} onChange={setField('department')} placeholder="e.g. Computer Science" wide />
                    <Field label="Course" name="course" value={fields.course} onChange={setField('course')} placeholder="Your current course of study" wide />
                    <label className="profile-wide"><span>School</span><input name="school" value={fields.school} readOnly /></label>
                  </div>
                  <ActionRow pending={pending} label="CONTINUE" onBack={() => setStep(1)} />
                </form>
              </>
            )}
            {error && <p className="onboarding-error" role="alert">{error}</p>}
          </section>
        </main>
      )}
      <footer className="onboarding-footer">© 2026 UNIVERSE All-in-One Platform. All rights reserved.</footer>
    </div>
  );
}

function Step({ number, active, complete, title, description }) {
  return <div className={`progress-step${active ? ' active' : ''}${complete ? ' complete' : ''}`}><span>{complete ? '✓' : number}</span><div><small>{active ? 'CURRENT STEP' : `STEP ${number}`}</small><strong>{title}</strong><p>{description}</p></div></div>;
}

function Field({ label, name, value, onChange, placeholder, type = 'text', wide = false }) {
  return <label className={wide ? 'profile-wide' : ''}><span>{label}</span><input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} /></label>;
}

function ActionRow({ pending, label, onBack }) {
  return <div className="action-row">{onBack ? <button className="action-back" type="button" onClick={onBack}>Back</button> : <span>Press <kbd>Enter ↵</kbd> to proceed</span>}<button className="action-next" type="submit" disabled={pending}>{pending ? 'SAVING...' : label} <ArrowIcon /></button></div>;
}

function GiftIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18v4H3zM5 14v7h14v-7M12 10v11M4 7h16v3H4zM12 7H8.5a2.5 2.5 0 1 1 2.2-3.7L12 7Zm0 0h3.5a2.5 2.5 0 1 0-2.2-3.7L12 7Z" /></svg>;
}

function Milestones({ onContinue }) {
  const items = [
    { icon: <StoreIcon />, title: 'Build Your Online Store', description: 'Set up and customize your online store in minutes.', action: 'Continue Setup', active: true },
    { icon: <GlobeIcon />, title: 'Get Your Own Domain', description: 'Find and secure the perfect domain name for your brand.', action: 'Connect Domain' },
    { icon: <ChartIcon />, title: 'Sale Analytics', description: 'Track your sales, customers and performance in real-time.', action: 'Configure' },
    { icon: <BoxIcon />, title: 'Post to Product', description: 'Add, manage and organize your products with ease.', action: 'Add Items' },
  ];
  return <main className="milestones-page"><div className="milestones-heading"><h1>Getting Started with UNIVERSE</h1><p>Complete these foundational milestones to kickstart your e-commerce journey and start generating revenue today.</p></div><section className="milestones-card"><div className="milestones-title"><div><span className="eyebrow">STARTERS</span><h2>Launch Checklist</h2></div><span>Step 3 of 4 completed</span></div><div className="milestone-list">{items.map((item) => <div className={`milestone${item.active ? ' active' : ''}`} key={item.title}><span className="milestone-node" /><div className="milestone-content"><div className="milestone-info"><span className="milestone-icon">{item.icon}</span><div><h3>{item.title}</h3><p>{item.description}</p></div></div><button type="button" onClick={item.active ? onContinue : undefined}>{item.action}</button></div></div>)}</div><div className="milestone-promos"><div><span><GiftIcon /></span><strong>Start 1 Month Free Trial</strong><small>Explore all features free for 1 month.</small></div><div><span><BoxIcon /></span><strong>Pay For Subscription Plan</strong><small>Choose the best plan for your business.</small></div></div></section></main>;
}

export default SellerOnboarding;
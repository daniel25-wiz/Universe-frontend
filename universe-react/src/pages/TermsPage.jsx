/**
 * UNIVERSE Terms of Service — pixel-faithful port of
 * terms_of_service_official_terms.html.
 *
 * Every clause, list item, label and warning uses the EXACT wording from the
 * official terms document. The page mirrors its design too: sticky top
 * navigation (brand + live clause search + Print + Accept Terms), dotted hero
 * banner with breadcrumb and binding-agreement notice, a sticky "Sections
 * Directory" sidebar with scroll-spy highlighting, eleven clause cards
 * (sapphire / rose / slate accents), the Terms Acknowledgment form and the
 * shared white multi-column footer.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './terms.css';

const ICON_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  viewBox: '0 0 24 24',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 2,
};

const SearchIcon = () => (
  <svg className="tou-search-icon" width={16} height={16} {...ICON_PROPS}>
    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PrintIcon = () => (
  <svg className="tou-print-icon" width={18} height={18} {...ICON_PROPS}>
    <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const ChevronIcon = () => (
  <svg className="tou-chevron" width={16} height={16} viewBox="0 0 20 20" fill="currentColor">
    <path clipRule="evenodd" fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
  </svg>
);

const WarningIcon = () => (
  <svg className="tou-binding-icon" width={48} height={48} {...ICON_PROPS}>
    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const HelpIcon = () => (
  <svg className="tou-help-icon" width={16} height={16} {...ICON_PROPS}>
    <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="tou-phone-icon" width={16} height={16} {...ICON_PROPS}>
    <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="tou-check-icon" width={20} height={20} {...ICON_PROPS}>
    <path d="M20 6l-4 4m-1 0v4h.01M13.732 4c-.77-1.333-2.694-1.333-3.464 0L10.586 10c.923.461.737 1.29.97 3.857V20" />
  </svg>
);
/* Exact content from terms_of_service_official_terms.html — do not edit. */
const SECTIONS = [
  {
    id: 'section-1',
    num: '01',
    title: 'About UNIVERSE',
    tone: 'sapphire',
    paras: [
      'UNIVERSE provides an ecommerce software platform that enables businesses and individuals to create and operate online stores.',
    ],
    label: 'UNIVERSE allows sellers to:',
    list: [
      'Create an online store.',
      'Add and manage products.',
      'Upload product images and other permitted content.',
      'Receive and manage customer orders.',
      'Manage sales information.',
      'Access payment-related functionality.',
      'Manage their store through their UNIVERSE account.',
    ],
    trail: [
      'UNIVERSE is primarily a technology platform. Unless expressly stated otherwise, UNIVERSE is not the seller of products listed by individual sellers.',
    ],
  },
  {
    id: 'section-2',
    num: '02',
    title: 'Creating an Account',
    tone: 'sapphire',
    paras: [
      'You must provide accurate information when creating an account. Certain features require an account.',
    ],
    label: 'You agree to:',
    ordered: true,
    list: [
      'Provide accurate, complete, and current information. Keep your account information updated.',
      'Maintain the security of your password and login credentials.',
      'Not share your account credentials with unauthorized persons.',
      'Notify UNIVERSE if you believe your account has been compromised.',
      "Accept responsibility for activity conducted through your account unless caused by unauthorized access resulting from UNIVERSE's failure to maintain reasonable security.",
      'You may not create accounts using false identities or impersonate another person or business.',
      'You must not create another account with UNIVERSE for the sake of avoiding subscription. If done consequences will be faced.',
    ],
  },
  {
    id: 'section-3',
    num: '03',
    title: 'Seller Accounts and Online Stores',
    tone: 'sapphire',
    paras: [
      'If you create a store on UNIVERSE, you are responsible for your store and everything you publish or sell through it.',
    ],
    label: 'You are responsible for:',
    list: [
      'Product descriptions.',
      'Product prices.',
      'Product availability.',
      'Product images and other content.',
      'Order fulfillment.',
      'Shipping and delivery arrangements.',
      'Customer communication.',
      'Refunds and returns where applicable.',
      'Compliance with consumer-protection laws.',
    ],
    trail: [
      'UNIVERSE does not guarantee the quality, safety, legality, authenticity, or suitability of products offered by independent sellers.',
    ],
  },
{
    id: 'section-4',
    num: '04',
    title: 'Products and Prohibited Items',
    toc: 'Products & Prohibited Items',
    tone: 'rose',
    paras: [
      'Sellers must not use UNIVERSE to sell, promote, distribute, or facilitate transactions involving unlawful or prohibited products or services.',
    ],
    label: 'Prohibited activities may include, without limitation:',
    list: [
      'Illegal goods or services.',
      'Fraudulent products or transactions.',
      'Stolen goods.',
      'Counterfeit goods.',
      "Products that infringe another person's intellectual-property rights.",
      'Regulated products where the seller does not have the required authorization.',
      'Content or products that violate applicable law.',
      'Any product or activity that UNIVERSE reasonably determines creates significant legal, security, or platform risk.',
    ],
    trail: [
      'UNIVERSE may remove listings, restrict stores, or suspend accounts that violate these rules.',
      'UNIVERSE may update its prohibited-products rules as necessary.',
    ],
  },
  {
    id: 'section-5',
    num: '05',
    title: 'Orders',
    tone: 'sapphire',
    paras: [
      "When a buyer places an order through a seller's store, the order is primarily a transaction between the buyer and the seller.",
    ],
    label: 'The seller is responsible for:',
    list: [
      'Accepting or rejecting the order where applicable.',
      'Providing the purchased product.',
      'Correctly describing the product.',
      'Fulfilling the order.',
      'Providing accurate delivery information.',
      'Handling applicable returns and refunds when necessary.',
    ],
    trail: [
      'UNIVERSE provides the technological infrastructure through which the order may be created and managed.',
    ],
    strong: [
      'Payments of order are only transferred to the seller once the buyer receives the products.',
    ],
  },
  {
    id: 'section-6',
    num: '06',
    title: 'Account Suspension and Termination',
    tone: 'sapphire',
    label: 'UNIVERSE may suspend, restrict, or terminate an account if:',
    list: [
      'You violate these Terms.',
      'You violate applicable law.',
      'Your account presents a security or fraud risk.',
      'You engage in fraudulent transactions.',
      'You fail to pay applicable fees.',
      'You upload prohibited content.',
      "You infringe another person's rights.",
      'Your use of the platform creates significant risk to UNIVERSE or other users.',
    ],
    trail: [
      'Where reasonably practicable, UNIVERSE may provide notice and an opportunity to correct the violation.',
      'UNIVERSE may immediately suspend an account where necessary to prevent fraud, security incidents, unlawful activity, or significant harm.',
    ],
  },
{
    id: 'section-7',
    num: '07',
    title: 'Data and Privacy',
    tone: 'sapphire',
    paras: [
      'Your use of UNIVERSE is also subject to our Privacy Policy, which explains how we collect, use, store, and protect personal information.',
      'By using UNIVERSE, you acknowledge that information may be processed as described in the Privacy Policy.',
    ],
  },
  {
    id: 'section-8',
    num: '08',
    title: 'Security',
    tone: 'sapphire',
    paras: [
      'UNIVERSE will implement reasonable technical and organizational measures designed to protect the platform and user information.',
      'However, no internet-based system can be guaranteed to be completely secure.',
      'You are responsible for maintaining the security of your account credentials and devices.',
      'You must promptly report suspected security vulnerabilities or unauthorized access to UNIVERSE.',
    ],
  },
  {
    id: 'section-9',
    num: '09',
    title: 'Third-Party Services',
    tone: 'sapphire',
    paras: [
      'UNIVERSE may integrate with third-party services, including payment processors.',
      'Third-party services may have separate terms and privacy policies.',
      'UNIVERSE is not responsible for the independent operation of third-party services.',
    ],
  },
  {
    id: 'section-10',
    num: '10',
    title: 'Changes to UNIVERSE',
    tone: 'sapphire',
    paras: [
      'UNIVERSE may add, modify, suspend, or remove features from the Service.',
      'We may also update these Terms from time to time.',
      'When changes are material, we may provide reasonable notice through the platform, email, or another appropriate method.',
      'Your continued use of UNIVERSE after the effective date of updated Terms constitutes acceptance of the updated Terms to the extent permitted by law.',
    ],
  },
  {
    id: 'section-11',
    num: '11',
    title: 'Disclaimers',
    tone: 'slate',
    paras: [
      'To the maximum extent permitted by applicable law, UNIVERSE provides the platform on an “as available” and “as is” basis.',
    ],
    label: 'UNIVERSE does not guarantee:',
    list: [
      'That every seller is legitimate.',
      'That every product is genuine, safe, or suitable.',
      'That every order will be fulfilled.',
      'That buyers will receive products within a particular period.',
      'That sellers will achieve a particular level of sales.',
      "That the Service will meet every user's individual requirements.",
    ],
    trail: [
      'Nothing in these Terms excludes rights or protections that cannot legally be excluded.',
    ],
  },
];

/* Pre-computed lowercased text for the live clause search filter. */
const LEGAL_SECTIONS = SECTIONS.map((section) => ({
  ...section,
  searchText: [
    section.title,
    section.label,
    ...(section.paras ?? []),
    ...(section.list ?? []),
    ...(section.trail ?? []),
    ...(section.strong ?? []),
  ]
    .join(' ')
    .toLowerCase(),
}));
/** Clause card renderer — badge tone follows the original document. */
function renderSection(section) {
  const toneClass = section.tone === 'rose'
    ? ' tou-card-num--rose'
    : section.tone === 'slate'
      ? ' tou-card-num--slate'
      : '';

  return (
    <article key={section.id} className="tou-card" id={section.id} data-legal-section>
      <div className="tou-card-row">
        <span className={`tou-card-num${toneClass}`}>{section.num}</span>
        <div className="tou-card-body">
          <h2 className="tou-card-title">{section.title}</h2>
          {section.paras?.map((p, i) => (
            <p key={i} className="tou-card-p">{p}</p>
          ))}
          {section.label && <p className="tou-card-label">{section.label}</p>}
          {section.list && (
            <ul className={section.ordered ? 'tou-list tou-list--ordered' : 'tou-list'}>
              {section.list.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
          {section.trail?.map((text, i) => (
            <p key={i} className="tou-card-trail">{text}</p>
          ))}
          {section.strong?.map((text, i) => (
            <p key={i} className="tou-card-trail--strong">{text}</p>
          ))}
        </div>
      </div>
    </article>
  );
}

function TermsPage() {
  const [query, setQuery] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.title = 'UNIVERSE Terms of Service';
    return () => {
      document.title = 'Universe - Launch, Manage, and Scale Your Online Marketplace';
    };
  }, []);

  // Deep-link support: arriving from another page at /terms#section-N (e.g. the
  // home footer's "Sellers Agreement" → /terms#section-3) scrolls that clause
  // card into view once it has rendered. The browser's native hash scroll runs
  // before React renders anything, so it never lands — this retries until the
  // target card exists. `.tou-card` already sets scroll-margin-top for the
  // sticky header.
  useEffect(() => {
    const hash = location.hash.replace(/^#/, '');
    if (!hash) return undefined;
    let cancelled = false;
    const tryScroll = (attempt) => {
      if (cancelled) return;
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (attempt < 25) window.setTimeout(() => tryScroll(attempt + 1), 120);
    };
    const timer = window.setTimeout(() => tryScroll(0), 80);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [location.pathname, location.hash]);

  // Live clause search — replicates the mockup's whatever-user-types filter.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LEGAL_SECTIONS;
    return LEGAL_SECTIONS.filter((section) => section.searchText.includes(q));
  }, [query]);

  // Scroll-spy: highlight the TOC entry of whichever section is in view.
  useEffect(() => {
    const links = Array.from(document.querySelectorAll('.tou-toc-item'));
    const articles = Array.from(document.querySelectorAll('article[data-legal-section]'));
    if (typeof IntersectionObserver === 'undefined' || articles.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            links.forEach((link) => {
              if (link.getAttribute('href') === `#${id}`) link.classList.add('active');
              else link.classList.remove('active');
            });
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    articles.forEach((article) => observer.observe(article));
    return () => observer.disconnect();
  }, [visible]);

  const handleAccept = (e) => {
    e.preventDefault();
    if (agreed) setSubmitted(true);
  };

  return (
    <div className="tou-page" id="tou-top">
      {/* ---- Top navigation ---- */}
      <header className="tou-header">
        <div className="tou-header-inner">
          <Link to="/" className="tou-brand" aria-label="UNIVERSE Home">
            <img src="/logo.png" alt="Universe" className="tou-brand-logo" />
          </Link>

          <div className="tou-search-wrap">
            <div className="tou-search">
              <SearchIcon />
              <input
                className="tou-search-input"
                id="clause-search"
                type="text"
                placeholder="Search terms, seller rules, escrow..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="tou-actions">
            <button
              type="button"
              className="tou-btn-print tou-no-print"
              onClick={() => window.print()}
              title="Print or save as PDF"
            >
              <PrintIcon />
              <span className="tou-print-label">Print / Save PDF</span>
            </button>
            <a className="tou-btn-accept tou-no-print" href="#agreement-confirmation">
              Accept Terms
            </a>
          </div>
        </div>
      </header>

      {/* ---- Hero banner ---- */}
      <div className="tou-hero">
        <div className="tou-hero-glow" aria-hidden="true" />
        <div className="tou-hero-inner">
          <nav className="tou-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <ChevronIcon />
            <a href="#legal-center">Legal Center</a>
            <ChevronIcon />
            <span className="tou-breadcrumb-current">Terms of Service</span>
          </nav>

          <div className="tou-heading-wrap">
            <span className="tou-badge">
              <span className="tou-pulse" />
              Official Platform Governance • September 2026
            </span>
            <h1 className="tou-title">UNIVERSE TERMS OF SERVICE</h1>
            <p className="tou-preamble">
              These Terms of Service govern your access to and use of the UNIVERSE website,
              applications, software, online-store services, payment-related feature and other
              services provided by UNIVERSE.
            </p>
            <div className="tou-binding" role="note">
              <WarningIcon />
              <div>
                <strong>Binding Agreement:</strong> By creating an account with UNIVERSE, you
                agree to these Terms. If you do not agree to these Terms, you must not use the
                service.
              </div>
            </div>
          </div>
        </div>
      </div>
{/* ---- Main content ---- */}
      <main className="tou-main">
        <div className="tou-grid">
          {/* Sticky sidebar: sections directory + help desk */}
          <aside className="tou-aside tou-no-print" aria-label="Table of contents">
            <div className="tou-toc-card">
              <div className="tou-toc-head">
                <h2 className="tou-toc-title">Sections Directory</h2>
                <span className="tou-toc-count">11 clauses</span>
              </div>
              <nav className="tou-toc" aria-label="Table of Contents">
                {LEGAL_SECTIONS.map((section, i) => (
                  <a key={section.id} className="tou-toc-item" href={`#${section.id}`}>
                    <span>{i + 1}. {section.toc || section.title}</span>
                    <span className="tou-toc-arrow">→</span>
                  </a>
                ))}
              </nav>
            </div>

            <div className="tou-help">
              <h3 className="tou-help-title"><HelpIcon /> Seller &amp; Student Inquiries</h3>
              <p className="tou-help-text">
                Have questions regarding campus seller licenses or our terms? Our compliance
                desk is open 24/7.
              </p>
              <a className="tou-help-phone" href="tel:07051917468"><PhoneIcon /> 07051917468</a>
            </div>
          </aside>

          {/* Legal articles list */}
          <div className="tou-articles" id="legal-sections-container">
            {visible.length === 0 ? (
              <div className="tou-no-results">
                No clauses match “{query}”. Try a different search term — for example escrow,
                seller rules or prohibited items.
              </div>
            ) : (
              visible.map(renderSection)
            )}

            {visible.length > 0 && (
              <div className="tou-acceptance tou-no-print" id="agreement-confirmation">
                <h3 className="tou-acceptance-title">Terms Acknowledgment &amp; Agreement</h3>
                <p className="tou-acceptance-desc">
                  Confirm your agreement to the UNIVERSE platform policy. This choice will be
                  recorded against your active merchant/buyer profile.
                </p>
                <form className="tou-accept-form" onSubmit={handleAccept}>
                  <label className="tou-check-label">
                    <input
                      className="tou-check"
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      required
                    />
                    <span className="tou-check-text">
                      I have thoroughly read, understood, and agree to the{' '}
                      <strong>UNIVERSE Terms of Service</strong>, including seller
                      responsibilities, prohibited item policies, and dispute escrow
                      resolutions.
                    </span>
                  </label>
                  <div className="tou-form-actions">
                    <button className="tou-btn-submit" type="submit">
                      Accept &amp; Continue
                    </button>
                    <a className="tou-btn-legal" href="mailto:support@universe.com">
                      Contact Legal Support
                    </a>
                  </div>
                </form>
              </div>
            )}

            {submitted && (
              <div className="tou-accept-success" role="status">
                <CheckIcon />
                <span>
                  <strong>Terms successfully accepted!</strong> Your agreement has been
                  recorded against your active UNIVERSE profile.
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
{/* ---- Footer ---- */}
      <footer className="tou-footer">
        <div className="tou-footer-inner">
          <div className="tou-footer-grid">
            <div className="tou-footer-brand-col">
              <div className="tou-footer-brand">
                <img src="/logo.png" alt="Universe" className="tou-footer-logo-img" />
              </div>
              <p className="tou-footer-desc">
                The premier multi-vendor university and commerce platform connecting campus
                merchants, verified local creators, and students.
              </p>
              <div className="tou-footer-contact">
                <p>
                  <strong>Direct Support Desk:</strong>{' '}
                  <a href="tel:07051917468">07051917468</a>
                </p>
                <p>
                  <strong>Legal &amp; Policy:</strong>{' '}
                  <a href="mailto:support@universe.com">support@universe.com</a>
                </p>
              </div>
            </div>

            <div>
              <h4 className="tou-footer-heading">UNIVERSE System</h4>
              <ul className="tou-footer-links">
                <li><a href="#tou-top">Seller Workshop</a></li>
                <li><a href="#tou-top">Campus Express Pickup</a></li>
                <li><a href="#tou-top">Merchant Verification</a></li>
                <li><a href="#tou-top">Escrow Protection</a></li>
              </ul>
            </div>

            <div>
              <h4 className="tou-footer-heading">Compliance &amp; Trust</h4>
              <ul className="tou-footer-links">
                <li><a className="tou-footer-strong" href="#section-1">Terms of Service</a></li>
                <li><a href="#section-7">Privacy Standard</a></li>
                <li><a href="#section-4">Prohibited Items</a></li>
                <li><a href="#section-8">Security Measures</a></li>
              </ul>
            </div>
          </div>

          <div className="tou-footer-bottom">
            <p>© 2026 UNIVERSE All-in-One Platforms Inc. All rights reserved.</p>
            <div className="tou-footer-meta">
              <a href="#tou-top">Status</a>
              <span>•</span>
              <a href="#tou-top">Security Audits</a>
              <span>•</span>
              <a href="#section-10">Version 2.4.0</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default TermsPage;
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const Testimonials = () => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  const testimonialsList = [
    {
      quote: "Universe completely transformed our sales flow. We built our shop front in under five minutes, and integrated instant checkout that immediately grew our conversion rate by 34%.",
      name: "Marcus Vance",
      role: "CEO at ElectroPlus",
      avatar: (
        <svg viewBox="0 0 100 100">
          <rect width="100%" height="100%" fill="#E0F2FE" />
          <circle cx="50" cy="40" r="20" fill="#0284C7" />
          <path d="M20 90 C 20 65, 80 65, 80 90 Z" fill="#0284C7" />
        </svg>
      )
    },
    {
      quote: "Managing stock and payouts was a nightmare with our legacy setups. Moving to Universe gave us instant analytics, one-click catalog management, and seamless payments.",
      name: "Clara Oster",
      role: "Founder at UrbanChic",
      avatar: (
        <svg viewBox="0 0 100 100">
          <rect width="100%" height="100%" fill="#D1FAE5" />
          <circle cx="50" cy="40" r="20" fill="#059669" />
          <path d="M20 90 C 20 65, 80 65, 80 90 Z" fill="#059669" />
        </svg>
      )
    },
    {
      quote: "The interconnected buyer-seller system is unmatched. Being able to plug our catalog directly into the global Universe index gave us organic traffic that tripled our average order values.",
      name: "Haron Vance",
      role: "Operations at TimeKeepers",
      avatar: (
        <svg viewBox="0 0 100 100">
          <rect width="100%" height="100%" fill="#FEF3C7" />
          <circle cx="50" cy="40" r="20" fill="#D97706" />
          <path d="M20 90 C 20 65, 80 65, 80 90 Z" fill="#D97706" />
        </svg>
      )
    }
  ];

  return (
    <section ref={ref} id="testimonials" className={`testimonials reveal ${isVisible ? "active" : ""}`}>
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Testimonials</span>
          <h2 className="section-title">Loved by business founders.</h2>
          <p className="section-description">
            See how merchants are using Universe to build profitable, scaling online stores.
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonialsList.map((test, i) => (
            <div key={i} className="testimonial-card">
              <div>
                {/* 5 Stars */}
                <div className="stars-wrapper" style={{ marginBottom: "16px" }}>
                  {[...Array(5)].map((_, idx) => (
                    <svg key={idx} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  ))}
                </div>
                <p className="testimonial-quote">"{test.quote}"</p>
              </div>

              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  {test.avatar}
                </div>
                <div>
                  <h4 className="testimonial-name">{test.name}</h4>
                  <span className="testimonial-role">{test.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
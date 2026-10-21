import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, PackageCheck, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { BUSINESS_CONFIG } from '../config/businessConfig';

export const AboutPage: React.FC = () => {
  return (
    <div className="section-padding" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        {/* Hero Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: '0.8125rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-gold-dark)', fontWeight: 700 }}>
            Our Story & Heritage
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', color: 'var(--color-maroon)', marginTop: '0.5rem', marginBottom: '1rem' }}>
            About {BUSINESS_CONFIG.brandName}
          </h1>
          <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--color-gold)', margin: '0 auto 1.5rem auto' }} />
          <p style={{ fontSize: '1.0625rem', color: 'var(--color-text-light)', lineHeight: 1.8, maxWidth: '720px', margin: '0 auto' }}>
            {BUSINESS_CONFIG.brandName} is an independent, family-run saree venture operated from our home. We are dedicated to curating thoughtful, beautiful ethnic sarees for family occasions, festivals, weddings, and everyday wear.
          </p>
        </div>

        {/* Main Content Card */}
        <div style={{ backgroundColor: '#FFFFFF', padding: 'clamp(1.5rem, 4vw, 3rem)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '1rem', color: 'var(--color-text)', lineHeight: 1.85 }}>
            <section>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-maroon)', marginBottom: '0.75rem' }}>
                A Family Tradition of Curation
              </h2>
              <p>
                Our venture was started with a simple, genuine love for Indian textiles. As a family-managed small business, we personally inspect, photograph, and handpick every single saree in our collection before presenting it to our patrons.
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                We believe that purchasing a saree for a milestone celebration or daily routine should be an experience rooted in trust, honest descriptions, and prompt personal attention.
              </p>
            </section>

            <section>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-maroon)', marginBottom: '0.75rem' }}>
                What We Offer
              </h2>
              <p>
                Our collection brings together a balanced range of textiles suited for different moments and budgets:
              </p>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong>Traditional Silk Sarees:</strong> Elegant silk pieces with rich borders and pallus tailored for weddings and grand festive gatherings.</li>
                <li><strong>Breathable Cotton Sarees:</strong> Soft Chanderi and pure mulmul cotton handlooms designed for comfort, office wear, and summer elegance.</li>
                <li><strong>Occasion & Designer Sarees:</strong> Lightweight organza and festive woven sarees adorned with modern embroidery and traditional motifs.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-maroon)', marginBottom: '0.75rem' }}>
                Our Guiding Commitments
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <PackageCheck size={28} color="var(--color-maroon)" style={{ marginBottom: '0.75rem' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
                    Personal Inspection
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', lineHeight: 1.6 }}>
                    Every saree is individually examined for fabric integrity, weaving consistency, and finish before it is packaged for dispatch.
                  </p>
                </div>

                <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <ShieldCheck size={28} color="var(--color-maroon)" style={{ marginBottom: '0.75rem' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
                    Honest Fabric Details
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', lineHeight: 1.6 }}>
                    We provide transparent specifications on fabric composition, length, blouse inclusion, and care instructions for every piece.
                  </p>
                </div>

                <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <Heart size={28} color="var(--color-maroon)" style={{ marginBottom: '0.75rem' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.375rem' }}>
                    Personal Customer Care
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', lineHeight: 1.6 }}>
                    Direct, responsive assistance for sizing, color inquiries, order tracking, and post-purchase support.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Action Links */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.75rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/shop" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              Explore Our Collection <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="btn-secondary">
              Contact Our Family Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

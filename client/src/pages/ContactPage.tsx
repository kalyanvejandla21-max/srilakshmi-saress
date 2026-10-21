import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, MessageSquare, ShieldCheck, Info } from 'lucide-react';
import { BUSINESS_CONFIG } from '../config/businessConfig';

export const ContactPage: React.FC = () => {
  const { contact, legalEntity, grievanceOfficer } = BUSINESS_CONFIG;

  return (
    <div className="section-padding" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: '0.8125rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-gold-dark)', fontWeight: 700 }}>
            Customer Support & Assistance
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', color: 'var(--color-maroon)', marginTop: '0.5rem', marginBottom: '1rem' }}>
            Contact Us
          </h1>
          <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--color-gold)', margin: '0 auto 1.5rem auto' }} />
          <p style={{ fontSize: '1rem', color: 'var(--color-text-light)', lineHeight: 1.7, maxWidth: '680px', margin: '0 auto' }}>
            Have a question about our sarees, need assistance with your order, or wish to initiate an exchange? Reach out to our family team directly.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {/* Phone & WhatsApp */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(92, 6, 28, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-maroon)', marginBottom: '1.25rem' }}>
              <Phone size={22} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.5rem' }}>
              Telephone & WhatsApp
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: '1rem' }}>
              Direct telephone inquiries & WhatsApp assistance:
            </p>

            {contact.isPhoneConfirmed && contact.phone ? (
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                  {contact.phoneDisplay}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  <a
                    href={`tel:${contact.phone}`}
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.875rem', fontSize: '0.8125rem' }}
                  >
                    Call Support
                  </a>
                  {contact.whatsapp && (
                    <a
                      href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-gold"
                      style={{ padding: '0.4rem 0.875rem', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      <MessageSquare size={14} /> WhatsApp Us
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 'auto', backgroundColor: 'var(--bg-primary)', padding: '0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <Info size={16} color="var(--color-gold-dark)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Working support phone line and WhatsApp channel will be activated upon final telecom carrier verification.</span>
              </div>
            )}
          </div>

          {/* Email Support */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(92, 6, 28, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-maroon)', marginBottom: '1.25rem' }}>
              <Mail size={22} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.5rem' }}>
              Email Support
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: '1rem' }}>
              Write to our team for order inquiries or exchange requests:
            </p>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.75rem', wordBreak: 'break-all' }}>
              {contact.isEmailConfirmed && contact.email ? contact.email : contact.emailDisplay}
            </div>

            {contact.isEmailConfirmed && contact.email ? (
              <a
                href={`mailto:${contact.email}`}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.875rem', fontSize: '0.8125rem', display: 'inline-block', alignSelf: 'flex-start', marginTop: 'auto' }}
              >
                Compose Email
              </a>
            ) : (
              <div style={{ marginTop: 'auto', backgroundColor: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.8125rem', color: 'var(--color-text-light)' }}>
                <span>Official support mailbox is currently being set up. Inquiries can be received once mailbox activation is complete.</span>
              </div>
            )}
          </div>

          {/* Operating Address & Hours */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(92, 6, 28, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-maroon)', marginBottom: '1.25rem' }}>
              <MapPin size={22} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.5rem' }}>
              Operating Facility
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
              Home-based Dispatch Studio:
            </p>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.6, marginBottom: '1rem' }}>
              {contact.fullAddress}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-light)', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
              <Clock size={16} color="var(--color-gold-dark)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{contact.supportHours}</span>
            </div>
          </div>
        </div>

        {/* Business Entity & Grievance Notice */}
        <div style={{ backgroundColor: '#FFFFFF', padding: 'clamp(1.5rem, 3vw, 2.25rem)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-maroon)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="var(--color-maroon)" /> Business Disclosures & Grievances
          </h2>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p>
              <strong>Trade & Operating Name:</strong> {BUSINESS_CONFIG.brandName}
            </p>
            <p>
              <strong>Legal Form:</strong> {legalEntity.entityType}
            </p>
            <p>
              <strong>Legal Proprietor:</strong> {legalEntity.legalOwnerName}
            </p>
            <p>
              <strong>GST Status:</strong> {legalEntity.gstin || 'Unregistered under GST threshold exemption limit (Notification No. 34/2023 - Central Tax)'}
            </p>
            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginTop: '0.5rem' }}>
              <strong style={{ color: 'var(--color-maroon)' }}>Customer Inquiries & Grievance Handling:</strong>
              <div style={{ marginTop: '0.25rem', color: 'var(--color-text-light)' }}>
                {grievanceOfficer.notice}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links Banner */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/track-order" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            Track Your Order
          </Link>
          <Link to="/policy/returns" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            Return & Exchange Policy
          </Link>
          <Link to="/policy/shipping" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            Shipping Policy
          </Link>
          <Link to="/about" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            About Us
          </Link>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Announcement } from '../../types';

interface AnnouncementBarProps {
  announcement?: Announcement;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ announcement }) => {
  // If explicitly disabled via settings/admin, hide the bar
  if (announcement && !announcement.isActive) return null;

  const ctaUrl = announcement?.linkUrl || '/shop?category=Silk+Sarees';
  const ctaText = announcement?.linkText || 'Shop Silk Sarees →';

  // We render 4 items in each of the 2 track groups to ensure seamless infinite looping on all resolutions
  const items = [0, 1, 2, 3];

  const renderAnnouncementItem = (key: string | number) => (
    <div className="announcement-item" key={key}>
      {/* Decorative Sparkle Icons */}
      <span className="announcement-sparkles" aria-hidden="true">
        <Sparkles size={13} className="sparkle-icon sparkle-main" />
        <Sparkles size={11} className="sparkle-icon sparkle-sub" />
      </span>

      {/* Main Promotional Offer Text */}
      <span className="announcement-content">
        <span className="announcement-lead">Grand Festive Offer:</span>{' '}
        Use code <span className="announcement-code">LAKSHMI10</span> for Flat 10% Off on All Pure Silk Sarees
      </span>

      {/* Elegant Pipe Separator */}
      <span className="announcement-separator" aria-hidden="true">|</span>

      {/* Free Shipping Tagline */}
      <span className="announcement-shipping">
        Free Express Shipping across India
      </span>

      {/* Elegant Pipe Separator */}
      <span className="announcement-separator" aria-hidden="true">|</span>

      {/* Clickable Underlined Call-to-Action Link */}
      <Link
        to={ctaUrl}
        className="announcement-cta"
        aria-label="Shop Pure Silk Sarees Collection"
      >
        {ctaText}
      </Link>
    </div>
  );

  return (
    <aside
      className="announcement-bar"
      role="region"
      aria-label="Promotional Announcement"
    >
      <div className="announcement-marquee-track">
        {/* Primary Track Group */}
        <div className="announcement-marquee-group">
          {items.map((idx) => renderAnnouncementItem(`primary-${idx}`))}
        </div>

        {/* Secondary Track Group (Exact Duplicate for Infinite Smooth Right-to-Left Loop) */}
        <div className="announcement-marquee-group" aria-hidden="true">
          {items.map((idx) => renderAnnouncementItem(`duplicate-${idx}`))}
        </div>
      </div>
    </aside>
  );
};

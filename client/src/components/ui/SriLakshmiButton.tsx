import React, { forwardRef } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import './SriLakshmiButton.css';

export type SriLakshmiButtonVariant = 'primary' | 'gold' | 'outline' | 'dark';
export type SriLakshmiButtonSize = 'sm' | 'md' | 'lg';

export interface BaseButtonProps {
  /** Visual variant reflecting Sri Lakshmi luxury design system */
  variant?: SriLakshmiButtonVariant;
  /** Size tier */
  size?: SriLakshmiButtonSize;
  /** Whether button stretches to fill container width */
  fullWidth?: boolean;
  /** Whether to render the luxury upward-right animated arrow */
  showArrow?: boolean;
  /** Custom icon replacement for ArrowUpRight */
  icon?: React.ReactNode;
  /** Icon placement */
  arrowPosition?: 'left' | 'right';
  /** Optional custom CSS classes */
  className?: string;
  /** Button content */
  children?: React.ReactNode;
  /** Accessible label fallback */
  label?: string;
}

// Button element props
export interface NativeButtonProps
  extends BaseButtonProps,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> {
  to?: undefined;
  href?: undefined;
}

// React Router Link props
export interface RouterLinkProps
  extends BaseButtonProps,
    Omit<LinkProps, keyof BaseButtonProps> {
  to: string;
  href?: undefined;
}

// Plain HTML anchor props
export interface AnchorProps
  extends BaseButtonProps,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseButtonProps> {
  href: string;
  to?: undefined;
}

export type SriLakshmiButtonProps = NativeButtonProps | RouterLinkProps | AnchorProps;

const getArrowSize = (size: SriLakshmiButtonSize): number => {
  switch (size) {
    case 'sm':
      return 13;
    case 'lg':
      return 18;
    case 'md':
    default:
      return 15;
  }
};

/**
 * SriLakshmiButton
 * Premium animated button component tailored for Sri Lakshmi Sarees.
 * Features an antique gold ambient sheen sweep, responsive hover lift,
 * and animated ArrowUpRight micro-interaction.
 * Supports button, React Router Link (`to="..."`), and anchor (`href="..."`) polymorphism.
 */
export const SriLakshmiButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  SriLakshmiButtonProps
>((props, ref) => {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    showArrow = true,
    icon,
    arrowPosition = 'right',
    className = '',
    children,
    label,
    ...rest
  } = props;

  const content = children || label;
  const arrowSize = getArrowSize(size);

  const buttonClasses = cn(
    'sl-btn',
    `sl-btn--${variant}`,
    `sl-btn--${size}`,
    fullWidth && 'sl-btn--full',
    (rest as any).disabled && 'sl-btn--disabled',
    className
  );

  const renderIcon = () => {
    if (!showArrow && !icon) return null;
    return (
      <span className="sl-btn-icon-wrapper" aria-hidden="true">
        <span className="sl-btn-icon">
          {icon || <ArrowUpRight size={arrowSize} strokeWidth={2.2} />}
        </span>
      </span>
    );
  };

  const innerContent = (
    <>
      {/* Animated Sheen / Light Flare Track */}
      <span className="sl-btn-sheen-track" aria-hidden="true">
        <span className="sl-btn-sheen" />
      </span>

      {/* Ambient Radial Glow */}
      <span className="sl-btn-glow" aria-hidden="true" />

      {/* Leading Icon (if arrowPosition === 'left') */}
      {arrowPosition === 'left' && renderIcon()}

      {/* Button Text / Children */}
      <span className="sl-btn-label">{content}</span>

      {/* Trailing Icon (default right) */}
      {arrowPosition === 'right' && renderIcon()}
    </>
  );

  // 1. React Router Link if `to` is provided
  if ('to' in props && props.to) {
    const { to, ...linkRest } = rest as RouterLinkProps;
    return (
      <Link
        to={to}
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={buttonClasses}
        {...linkRest}
      >
        {innerContent}
      </Link>
    );
  }

  // 2. Regular HTML Anchor if `href` is provided
  if ('href' in props && props.href) {
    const { href, ...anchorRest } = rest as AnchorProps;
    return (
      <a
        href={href}
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={buttonClasses}
        {...anchorRest}
      >
        {innerContent}
      </a>
    );
  }

  // 3. Default HTML Button element
  const buttonRest = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={buttonRest.type || 'button'}
      className={buttonClasses}
      disabled={buttonRest.disabled}
      {...buttonRest}
    >
      {innerContent}
    </button>
  );
});

SriLakshmiButton.displayName = 'SriLakshmiButton';

export default SriLakshmiButton;


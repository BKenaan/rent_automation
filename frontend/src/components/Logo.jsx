import React from 'react';

/**
 * RentalMan SVG logo mark — works at any size.
 * Use size prop to control dimensions (default 32).
 * Use showName prop to render the wordmark next to the icon.
 */
const Logo = ({ size = 32, showName = false, nameSize = '1rem', className = '' }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }} className={className}>
        <svg
            width={size}
            height={size}
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="RentalMan logo"
        >
            <rect width="36" height="36" rx="9" fill="#1B2B4E" />
            <g fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6.3,14.4 18,6.3 29.7,14.4" />
                <path d="M24 10.6 V7" />
                <path d="M9 13.6 V29.2 H27 V13.6" />
            </g>
            <circle cx="18" cy="18" r="3" fill="#8b5cf6" />
            <polygon points="16.65,19 19.35,19 21,25.3 15,25.3" fill="#8b5cf6" />
        </svg>
        {showName && (
            <span style={{
                fontSize: nameSize,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text, #f4f4f5)',
                lineHeight: 1,
            }}>
                RentalMan
            </span>
        )}
    </span>
);

export default Logo;

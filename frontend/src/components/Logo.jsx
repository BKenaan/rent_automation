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
            <rect width="36" height="36" rx="9" fill="#8b5cf6" />
            <path
                d="M5 18L18 7L31 18"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <rect x="8" y="17" width="20" height="13" rx="1.5" fill="white" fillOpacity="0.95" />
            <rect x="11" y="20" width="5" height="4" rx="1" fill="#8b5cf6" />
            <rect x="20" y="20" width="5" height="4" rx="1" fill="#8b5cf6" />
            <rect x="14" y="24" width="8" height="6" rx="1" fill="#8b5cf6" fillOpacity="0.55" />
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

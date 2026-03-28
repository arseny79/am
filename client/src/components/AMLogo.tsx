interface AMLogoProps {
  size?: number;
  className?: string;
}

export function AMLogo({ size = 32, className = "" }: AMLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-label="Acquisitions.market"
    >
      <circle cx="32" cy="32" r="30" fill="#0f172a" />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="700"
        fontSize="20"
        letterSpacing="-0.5"
        fill="#ffffff"
      >
        AM
      </text>
    </svg>
  );
}

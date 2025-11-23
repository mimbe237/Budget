import Image from 'next/image';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  full: {
    sm: { width: 120, height: 38 },
    md: { width: 160, height: 50 },
    lg: { width: 200, height: 62 },
  },
  icon: {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
  },
};

export default function Logo({ 
  variant = 'full', 
  size = 'md',
  className = '' 
}: LogoProps) {
  const dimensions = sizeMap[variant][size];
  const src = variant === 'full' ? '/logo-full.svg' : '/logo-icon.svg';

  return (
    <Image
      src={src}
      alt="BudgetPro"
      width={dimensions.width}
      height={dimensions.height}
      className={className}
      priority
    />
  );
}

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', ...props }) => {
  return (
    <button
      {...props}
      className="px-4 py-2 rounded font-medium bg-brand text-white hover:bg-brand-dark transition-colors"
    >
      {children}
    </button>
  );
};

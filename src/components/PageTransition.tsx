import { ReactNode, HTMLAttributes } from 'react';

interface PageTransitionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const PageTransition = ({ children, className = '', ...props }: PageTransitionProps) => {
  return (
    <div className={`animate-fade-in ${className}`} {...props}>
      {children}
    </div>
  );
};

export default PageTransition;

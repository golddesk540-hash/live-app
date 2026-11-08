import React from 'react';
import { cn } from '@/lib/utils';
import { Container } from './Container';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  noContainer?: boolean;
}

export const Section: React.FC<SectionProps> = ({
  children,
  className,
  containerSize = 'lg',
  noContainer = false,
  ...props
}) => {
  return (
    <section className={cn('py-12 md:py-20 relative', className)} {...props}>
      {noContainer ? children : <Container size={containerSize}>{children}</Container>}
    </section>
  );
};

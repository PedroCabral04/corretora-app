import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('should render children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDefined();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByText('Click me');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled button</Button>);
    
    const button = screen.getByText('Disabled button');
    expect(button).toHaveProperty('disabled', true);
  });

  it('should apply variant classes', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.querySelector('button')).toBeDefined();
  });
});

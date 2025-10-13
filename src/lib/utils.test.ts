import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  describe('Basic Functionality', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-2 py-1', 'px-4');
      expect(result).toBe('py-1 px-4');
    });

    it('should handle single class name', () => {
      const result = cn('text-center');
      expect(result).toBe('text-center');
    });

    it('should handle multiple class names', () => {
      const result = cn('text-center', 'font-bold', 'text-red-500');
      expect(result).toContain('text-center');
      expect(result).toContain('font-bold');
    });

    it('should handle empty strings', () => {
      const result = cn('', 'text-center', '');
      expect(result).toBe('text-center');
    });

    it('should handle no arguments', () => {
      const result = cn();
      expect(result).toBe('');
    });
  });

  describe('Conditional Classes', () => {
    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class active-class');
    });

    it('should handle false conditional', () => {
      const isActive = false;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class');
    });

    it('should handle multiple conditionals', () => {
      const isActive = true;
      const isDisabled = false;
      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      );
      expect(result).toBe('base-class active-class');
    });

    it('should handle ternary operators', () => {
      const isActive = true;
      const result = cn('base-class', isActive ? 'active' : 'inactive');
      expect(result).toBe('base-class active');
    });
  });

  describe('Null and Undefined Handling', () => {
    it('should handle undefined values', () => {
      const result = cn('base-class', undefined, 'other-class');
      expect(result).toBe('base-class other-class');
    });

    it('should handle false values', () => {
      const result = cn('base-class', false, 'other-class');
      expect(result).toBe('base-class other-class');
    });

    it('should handle null values', () => {
      const result = cn('base-class', null, 'other-class');
      expect(result).toBe('base-class other-class');
    });

    it('should handle mixed falsy values', () => {
      const result = cn('base-class', undefined, false, null, '', 'other-class');
      expect(result).toBe('base-class other-class');
    });
  });

  describe('Tailwind Class Merging', () => {
    it('should merge conflicting background colors', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toBe('bg-blue-500');
    });

    it('should merge conflicting text colors', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    it('should merge conflicting padding', () => {
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8');
    });

    it('should merge conflicting margin', () => {
      const result = cn('m-2', 'm-4');
      expect(result).toBe('m-4');
    });

    it('should keep non-conflicting classes', () => {
      const result = cn('bg-red-500 text-white', 'bg-blue-500 font-bold');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('text-white');
      expect(result).toContain('font-bold');
    });

    it('should merge specific padding over general padding', () => {
      const result = cn('p-4', 'px-2');
      expect(result).toBe('p-4 px-2');
    });

    it('should handle responsive classes', () => {
      const result = cn('text-sm', 'md:text-lg', 'lg:text-xl');
      expect(result).toContain('text-sm');
      expect(result).toContain('md:text-lg');
      expect(result).toContain('lg:text-xl');
    });

    it('should merge conflicting width classes', () => {
      const result = cn('w-full', 'w-1/2');
      expect(result).toBe('w-1/2');
    });

    it('should merge conflicting height classes', () => {
      const result = cn('h-screen', 'h-full');
      expect(result).toBe('h-full');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle arrays of classes', () => {
      const result = cn(['text-center', 'font-bold'], 'text-red-500');
      expect(result).toContain('text-center');
      expect(result).toContain('font-bold');
      expect(result).toContain('text-red-500');
    });

    it('should handle nested conditionals', () => {
      const isPrimary = true;
      const isLarge = false;
      const result = cn(
        'btn',
        isPrimary && 'btn-primary',
        isLarge && 'btn-lg',
        !isLarge && 'btn-sm'
      );
      expect(result).toContain('btn');
      expect(result).toContain('btn-primary');
      expect(result).toContain('btn-sm');
      expect(result).not.toContain('btn-lg');
    });

    it('should handle object notation', () => {
      const classes = {
        'text-center': true,
        'font-bold': false,
        'text-red-500': true,
      };
      const result = cn(classes);
      expect(result).toContain('text-center');
      expect(result).not.toContain('font-bold');
      expect(result).toContain('text-red-500');
    });

    it('should handle mix of strings, arrays, and objects', () => {
      const result = cn(
        'base',
        ['extra', 'more'],
        { active: true, disabled: false },
        'final'
      );
      expect(result).toContain('base');
      expect(result).toContain('extra');
      expect(result).toContain('more');
      expect(result).toContain('active');
      expect(result).not.toContain('disabled');
      expect(result).toContain('final');
    });
  });

  describe('State-Based Classes', () => {
    it('should handle hover states', () => {
      const result = cn('bg-blue-500', 'hover:bg-blue-600');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('hover:bg-blue-600');
    });

    it('should handle focus states', () => {
      const result = cn('border-gray-300', 'focus:border-blue-500');
      expect(result).toContain('border-gray-300');
      expect(result).toContain('focus:border-blue-500');
    });

    it('should handle active states', () => {
      const result = cn('text-gray-700', 'active:text-gray-900');
      expect(result).toContain('text-gray-700');
      expect(result).toContain('active:text-gray-900');
    });

    it('should handle disabled states', () => {
      const result = cn('cursor-pointer', 'disabled:cursor-not-allowed');
      expect(result).toContain('cursor-pointer');
      expect(result).toContain('disabled:cursor-not-allowed');
    });
  });

  describe('Dark Mode Classes', () => {
    it('should handle dark mode variants', () => {
      const result = cn('bg-white', 'dark:bg-gray-800');
      expect(result).toContain('bg-white');
      expect(result).toContain('dark:bg-gray-800');
    });

    it('should handle multiple dark mode classes', () => {
      const result = cn('bg-white text-gray-900', 'dark:bg-gray-800 dark:text-white');
      expect(result).toContain('bg-white');
      expect(result).toContain('text-gray-900');
      expect(result).toContain('dark:bg-gray-800');
      expect(result).toContain('dark:text-white');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long class strings', () => {
      const longClasses = 'p-4 m-2 bg-blue-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out';
      const result = cn(longClasses, 'bg-red-500');
      expect(result).toContain('p-4');
      expect(result).toContain('m-2');
      expect(result).toContain('bg-red-500');
      expect(result).not.toContain('bg-blue-500');
    });

    it('should handle special characters in custom classes', () => {
      const result = cn('custom-class-1', 'custom-class-2');
      expect(result).toContain('custom-class-1');
      expect(result).toContain('custom-class-2');
    });

    it('should handle numeric class names', () => {
      const result = cn('z-10', 'z-20');
      expect(result).toBe('z-20');
    });

    it('should handle fraction-based classes', () => {
      const result = cn('w-1/2', 'w-1/3');
      expect(result).toBe('w-1/3');
    });

    it('should handle arbitrary values', () => {
      const result = cn('w-[100px]', 'h-[200px]');
      expect(result).toContain('w-[100px]');
      expect(result).toContain('h-[200px]');
    });
  });

  describe('Performance Cases', () => {
    it('should handle many arguments efficiently', () => {
      const result = cn(
        'class1', 'class2', 'class3', 'class4', 'class5',
        'class6', 'class7', 'class8', 'class9', 'class10'
      );
      expect(result).toContain('class1');
      expect(result).toContain('class10');
    });

    it('should handle repeated calls with same inputs', () => {
      const input = 'text-center font-bold';
      const result1 = cn(input);
      const result2 = cn(input);
      expect(result1).toBe(result2);
    });
  });
});

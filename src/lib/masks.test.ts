import { describe, it, expect } from 'vitest';
import {
  maskPhone,
  unmaskPhone,
  maskCurrency,
  unmaskCurrency,
  maskCPF,
  maskCRECI,
  validateEmail,
  validatePhone,
  validateCPF,
  validateRequired,
  getErrorMessage,
} from '@/lib/masks';

describe('Phone Masking', () => {
  describe('maskPhone', () => {
    it('should handle empty string', () => {
      expect(maskPhone('')).toBe('');
    });

    it('should format 2 digits', () => {
      expect(maskPhone('11')).toBe('(11');
    });

    it('should format 6 digits', () => {
      expect(maskPhone('119999')).toBe('(11) 9999');
    });

    it('should format 10 digits (landline)', () => {
      expect(maskPhone('1199991234')).toBe('(11) 9999-1234');
    });

    it('should format 11 digits (mobile)', () => {
      expect(maskPhone('11999991234')).toBe('(11) 99999-1234');
    });

    it('should remove non-numeric characters', () => {
      expect(maskPhone('(11) 99999-1234')).toBe('(11) 99999-1234');
    });

    it('should truncate at 11 digits', () => {
      expect(maskPhone('119999912345678')).toBe('(11) 99999-1234');
    });

    it('should handle letters and special characters', () => {
      expect(maskPhone('11abc99999def1234')).toBe('(11) 99999-1234');
    });
  });

  describe('unmaskPhone', () => {
    it('should remove all non-numeric characters', () => {
      expect(unmaskPhone('(11) 99999-1234')).toBe('11999991234');
    });

    it('should handle empty string', () => {
      expect(unmaskPhone('')).toBe('');
    });

    it('should handle already unmasked phone', () => {
      expect(unmaskPhone('11999991234')).toBe('11999991234');
    });

    it('should handle phone with spaces and dashes only', () => {
      expect(unmaskPhone('11 99999 1234')).toBe('11999991234');
    });
  });
});

describe('Currency Masking', () => {
  describe('maskCurrency', () => {
    it('should handle empty string', () => {
      expect(maskCurrency('')).toBe('');
    });

    it('should format zero', () => {
      const result = maskCurrency('0');
      expect(result).toBe('R$ 0,00');
    });

    it('should format cents', () => {
      const result = maskCurrency('50');
      expect(result).toBe('R$ 0,50');
    });

    it('should format one real', () => {
      const result = maskCurrency('100');
      expect(result).toBe('R$ 1,00');
    });

    it('should format thousands', () => {
      const result = maskCurrency('123456');
      expect(result).toBe('R$ 1.234,56');
    });

    it('should format millions', () => {
      const result = maskCurrency('123456789');
      expect(result).toBe('R$ 1.234.567,89');
    });

    it('should remove non-numeric characters', () => {
      const result = maskCurrency('R$ 1.234,56');
      expect(result).toBe('R$ 1.234,56');
    });
  });

  describe('unmaskCurrency', () => {
    it('should convert masked value to number', () => {
      expect(unmaskCurrency('R$ 1.234,56')).toBe(1234.56);
    });

    it('should handle zero', () => {
      expect(unmaskCurrency('R$ 0,00')).toBe(0);
    });

    it('should handle cents only', () => {
      expect(unmaskCurrency('R$ 0,50')).toBe(0.50);
    });

    it('should handle already numeric string', () => {
      expect(unmaskCurrency('12345')).toBe(123.45);
    });

    it('should handle empty string', () => {
      expect(unmaskCurrency('')).toBe(0);
    });
  });
});

describe('CPF Masking', () => {
  describe('maskCPF', () => {
    it('should handle empty string', () => {
      expect(maskCPF('')).toBe('');
    });

    it('should format 3 digits', () => {
      expect(maskCPF('123')).toBe('123');
    });

    it('should format 6 digits', () => {
      expect(maskCPF('123456')).toBe('123.456');
    });

    it('should format 9 digits', () => {
      expect(maskCPF('123456789')).toBe('123.456.789');
    });

    it('should format 11 digits (complete CPF)', () => {
      expect(maskCPF('12345678901')).toBe('123.456.789-01');
    });

    it('should remove non-numeric characters', () => {
      expect(maskCPF('123.456.789-01')).toBe('123.456.789-01');
    });

    it('should truncate at 11 digits', () => {
      expect(maskCPF('123456789012345')).toBe('123.456.789-01');
    });
  });
});

describe('CRECI Masking', () => {
  describe('maskCRECI', () => {
    it('should handle empty string', () => {
      expect(maskCRECI('')).toBe('');
    });

    it('should format 5 digits', () => {
      expect(maskCRECI('12345')).toBe('12345');
    });

    it('should format 6 characters with letter', () => {
      expect(maskCRECI('12345F')).toBe('12345-F');
    });

    it('should convert lowercase to uppercase', () => {
      expect(maskCRECI('12345f')).toBe('12345-F');
    });

    it('should remove special characters', () => {
      expect(maskCRECI('12345-F')).toBe('12345-F');
    });

    it('should truncate at 6 characters', () => {
      expect(maskCRECI('12345FGH')).toBe('12345-F');
    });

    it('should handle only numbers', () => {
      expect(maskCRECI('123456')).toBe('12345-6');
    });
  });
});

describe('Email Validation', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('should validate email with subdomain', () => {
      expect(validateEmail('user@mail.example.com')).toBe(true);
    });

    it('should validate email with plus sign', () => {
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should validate email with dots', () => {
      expect(validateEmail('first.last@example.com')).toBe(true);
    });

    it('should reject email without @', () => {
      expect(validateEmail('userexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(validateEmail('user@')).toBe(false);
    });

    it('should reject email without TLD', () => {
      expect(validateEmail('user@example')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(validateEmail('user @example.com')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateEmail('')).toBe(false);
    });

    it('should reject email starting with @', () => {
      expect(validateEmail('@example.com')).toBe(false);
    });
  });
});

describe('Phone Validation', () => {
  describe('validatePhone', () => {
    it('should validate 10 digits (landline)', () => {
      expect(validatePhone('1199991234')).toBe(true);
    });

    it('should validate 11 digits (mobile)', () => {
      expect(validatePhone('11999991234')).toBe(true);
    });

    it('should validate masked landline', () => {
      expect(validatePhone('(11) 9999-1234')).toBe(true);
    });

    it('should validate masked mobile', () => {
      expect(validatePhone('(11) 99999-1234')).toBe(true);
    });

    it('should reject 9 digits', () => {
      expect(validatePhone('119999123')).toBe(false);
    });

    it('should reject 12 digits', () => {
      expect(validatePhone('119999123456')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validatePhone('')).toBe(false);
    });

    it('should reject letters', () => {
      expect(validatePhone('11abcdefgh')).toBe(false);
    });
  });
});

describe('CPF Validation', () => {
  describe('validateCPF', () => {
    it('should validate correct CPF', () => {
      expect(validateCPF('11144477735')).toBe(true);
    });

    it('should validate masked CPF', () => {
      expect(validateCPF('111.444.777-35')).toBe(true);
    });

    it('should reject CPF with wrong first digit', () => {
      expect(validateCPF('11144477736')).toBe(false);
    });

    it('should reject CPF with wrong second digit', () => {
      expect(validateCPF('11144477734')).toBe(false);
    });

    it('should reject CPF with all same digits', () => {
      expect(validateCPF('11111111111')).toBe(false);
      expect(validateCPF('00000000000')).toBe(false);
      expect(validateCPF('99999999999')).toBe(false);
    });

    it('should reject CPF with less than 11 digits', () => {
      expect(validateCPF('1114447773')).toBe(false);
    });

    it('should reject CPF with more than 11 digits', () => {
      expect(validateCPF('111444777350')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateCPF('')).toBe(false);
    });

    it('should reject CPF with letters', () => {
      expect(validateCPF('111.444.777-3A')).toBe(false);
    });

    it('should validate another correct CPF', () => {
      expect(validateCPF('52998224725')).toBe(true);
    });
  });
});

describe('Required Validation', () => {
  describe('validateRequired', () => {
    it('should validate non-empty string', () => {
      expect(validateRequired('test')).toBe(true);
    });

    it('should validate string with spaces', () => {
      expect(validateRequired('test value')).toBe(true);
    });

    it('should reject empty string', () => {
      expect(validateRequired('')).toBe(false);
    });

    it('should reject string with only spaces', () => {
      expect(validateRequired('   ')).toBe(false);
    });

    it('should reject string with only tabs', () => {
      expect(validateRequired('\t\t')).toBe(false);
    });

    it('should validate string with leading/trailing spaces', () => {
      expect(validateRequired('  test  ')).toBe(true);
    });
  });
});

describe('Error Messages', () => {
  describe('getErrorMessage', () => {
    it('should return required error message', () => {
      expect(getErrorMessage('Nome', 'required')).toBe('Nome é obrigatório');
    });

    it('should return email error message', () => {
      expect(getErrorMessage('Email', 'email')).toBe('Email inválido');
    });

    it('should return phone error message', () => {
      expect(getErrorMessage('Telefone', 'phone')).toBe('Telefone inválido. Use o formato (99) 99999-9999');
    });

    it('should return CPF error message', () => {
      expect(getErrorMessage('CPF', 'cpf')).toBe('CPF inválido');
    });

    it('should work with different field names', () => {
      expect(getErrorMessage('Endereço', 'required')).toBe('Endereço é obrigatório');
      expect(getErrorMessage('Dados', 'required')).toBe('Dados é obrigatório');
    });
  });
});

describe('Edge Cases and Integration', () => {
  it('should handle multiple masking operations', () => {
    const phone = '11999991234';
    const masked = maskPhone(phone);
    const unmasked = unmaskPhone(masked);
    expect(unmasked).toBe(phone);
  });

  it('should handle currency conversion back and forth', () => {
    const value = '123456';
    const masked = maskCurrency(value);
    const unmasked = unmaskCurrency(masked);
    expect(unmasked).toBe(1234.56);
  });

  it('should validate CPF after masking', () => {
    const cpf = '11144477735';
    const masked = maskCPF(cpf);
    expect(validateCPF(masked)).toBe(true);
  });

  it('should validate phone after masking', () => {
    const phone = '11999991234';
    const masked = maskPhone(phone);
    expect(validatePhone(masked)).toBe(true);
  });

  it('should handle special input values gracefully', () => {
    // Testing with empty-like values
    expect(maskPhone('null')).toBe('');
    expect(maskCurrency('0')).toBe('R$ 0,00');
    expect(maskCPF('000')).toBe('000');
    expect(maskCRECI('00000')).toBe('00000');
  });
});

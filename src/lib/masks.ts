// Máscara de telefone brasileiro: (99) 99999-9999 ou (99) 9999-9999
export const maskPhone = (value: string): string => {
  if (!value) return '';
  
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara conforme o tamanho
  if (numbers.length <= 2) {
    return `(${numbers}`;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }
};

// Remove máscara do telefone
export const unmaskPhone = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Máscara de moeda brasileira: R$ 1.234,56
export const maskCurrency = (value: string): string => {
  if (!value) return '';
  
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');
  
  // Converte para centavos
  const amount = Number(numbers) / 100;
  
  // Formata como moeda
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

// Remove máscara da moeda e retorna número
export const unmaskCurrency = (value: string): number => {
  const numbers = value.replace(/\D/g, '');
  return Number(numbers) / 100;
};

// Máscara de CPF: 999.999.999-99
export const maskCPF = (value: string): string => {
  if (!value) return '';
  
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  } else if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  } else {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  }
};

// Máscara de CRECI: 12345-F ou 12345
export const maskCRECI = (value: string): string => {
  if (!value) return '';
  
  // Mantém apenas números e letras
  const cleaned = value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  
  if (cleaned.length <= 5) {
    return cleaned;
  } else {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 6)}`;
  }
};

// Validações
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const numbers = unmaskPhone(phone);
  return numbers.length === 10 || numbers.length === 11;
};

export const validateCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '');
  
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(numbers[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== Number(numbers[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(numbers[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== Number(numbers[10])) return false;
  
  return true;
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

// Mensagens de erro de validação
export const getErrorMessage = (field: string, type: 'required' | 'email' | 'phone' | 'cpf'): string => {
  const messages = {
    required: `${field} é obrigatório`,
    email: 'Email inválido',
    phone: 'Telefone inválido. Use o formato (99) 99999-9999',
    cpf: 'CPF inválido',
  };
  
  return messages[type];
};

// Hook personalizado para inputs com máscara
export const useMaskedInput = (initialValue: string, maskFn: (value: string) => string) => {
  const [value, setValue] = React.useState(maskFn(initialValue));
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskFn(e.target.value);
    setValue(masked);
  };
  
  return { value, onChange: handleChange, setValue };
};

// Importação necessária para o hook
import React from 'react';

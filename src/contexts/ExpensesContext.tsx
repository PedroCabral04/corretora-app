import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './AuthContext';

export interface Expense {
  id: string;
  brokerId: string;
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
}

interface ExpensesContextType {
  expenses: Expense[];
  isLoading: boolean;
  createExpense: (data: Omit<Expense, 'id'>) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  getExpensesByBrokerId: (brokerId: string) => Expense[];
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

export const useExpenses = () => {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpensesProvider');
  return ctx;
};

interface ExpensesProviderProps {
  children: ReactNode;
}

export const ExpensesProvider = ({ children }: ExpensesProviderProps) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchExpenses = async () => {
    if (!user) {
      setExpenses([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

      if (error) throw error;

      const mappedExpenses: Expense[] = (data || []).map(expense => ({
        id: expense.id,
        brokerId: expense.broker_id,
        description: expense.description,
        amount: Number(expense.amount),
        category: expense.category,
        expenseDate: expense.expense_date
      }));

      setExpenses(mappedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  const createExpense = async (data: Omit<Expense, 'id'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const expenseData = {
      user_id: user.id,
      broker_id: data.brokerId,
      description: data.description,
      amount: data.amount,
      category: data.category,
      expense_date: data.expenseDate
    };

    const { data: newExpense, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select()
      .single();

    if (error) throw error;

    const mappedExpense: Expense = {
      id: newExpense.id,
      brokerId: newExpense.broker_id,
      description: newExpense.description,
      amount: Number(newExpense.amount),
      category: newExpense.category,
      expenseDate: newExpense.expense_date
    };

    setExpenses(prev => [mappedExpense, ...prev]);
    return mappedExpense;
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const updateData: any = {};
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.expenseDate !== undefined) updateData.expense_date = data.expenseDate;

    const { data: updatedExpense, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    const mappedExpense: Expense = {
      id: updatedExpense.id,
      brokerId: updatedExpense.broker_id,
      description: updatedExpense.description,
      amount: Number(updatedExpense.amount),
      category: updatedExpense.category,
      expenseDate: updatedExpense.expense_date
    };

    setExpenses(prev => prev.map(expense => expense.id === id ? mappedExpense : expense));
    return mappedExpense;
  };

  const deleteExpense = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const getExpensesByBrokerId = (brokerId: string) => expenses.filter(e => e.brokerId === brokerId);

  const value: ExpensesContextType = {
    expenses,
    isLoading,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpensesByBrokerId
  };

  return (
    <ExpensesContext.Provider value={value}>
      {children}
    </ExpensesContext.Provider>
  );
};
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

export type Movement = { id: string; amount: number; note: string; createdAt: string; balance: number };
export type Goal = { id: string; title: string; target: number; initial: number; createdAt: string; completedAt?: string; movements: Movement[] };
export type Task = { id: string; title: string; done: boolean; phase?: string; category?: string };
export type Checklist = { id: string; title: string; tasks: Task[] };
export type DateGoal = { id: string; title: string; createdAt: string; targetDate: string };
type State = { activeGoal: Goal | null; archivedGoals: Goal[]; checklists: Checklist[]; dateGoals: DateGoal[] };
type Store = State & { hydrated: boolean; createGoal: (title: string, target: number, initial: number) => void; addMovement: (amount: number, note: string) => void; addDateGoal: (title: string, targetDate: Date) => void; addChecklist: (title: string, tasks: Omit<Task, 'id'>[]) => void; renameChecklist: (listId: string, title: string) => void; toggleTask: (listId: string, taskId: string) => void; addTask: (listId: string, title: string) => void; deleteTask: (listId: string, taskId: string) => void; deleteChecklist: (listId: string) => void };

const STORAGE_KEY = '@checks/state/v1';
const initialState: State = { activeGoal: null, archivedGoals: [], checklists: [], dateGoals: [] };
const Context = createContext<Store | null>(null);
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const getBalance = (goal: Goal) => goal.initial + goal.movements.reduce((sum, item) => sum + item.amount, 0);

export function ChecksProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<State>(initialState);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((saved) => { if (!saved) return; const parsed = JSON.parse(saved) as Partial<State>; setState({ ...initialState, ...parsed, dateGoals: parsed.dateGoals ?? [] }); }).catch(() => undefined).finally(() => setHydrated(true)); }, []);
  useEffect(() => { if (hydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined); }, [hydrated, state]);
  const value = useMemo<Store>(() => ({
    ...state, hydrated,
    createGoal: (title, target, initial) => setState((current) => ({ ...current, activeGoal: { id: uid(), title, target, initial, createdAt: new Date().toISOString(), movements: [] } })),
    addDateGoal: (title, targetDate) => setState((current) => ({ ...current, dateGoals: [...current.dateGoals, { id: uid(), title, createdAt: new Date().toISOString(), targetDate: targetDate.toISOString() }] })),
    addMovement: (amount, note) => setState((current) => {
      if (!current.activeGoal) return current;
      const balance = getBalance(current.activeGoal) + amount;
      const updated: Goal = { ...current.activeGoal, movements: [...current.activeGoal.movements, { id: uid(), amount, note, balance, createdAt: new Date().toISOString() }] };
      if (balance >= updated.target) return { ...current, activeGoal: null, archivedGoals: [{ ...updated, completedAt: new Date().toISOString() }, ...current.archivedGoals] };
      return { ...current, activeGoal: updated };
    }),
    addChecklist: (title, tasks) => setState((current) => ({ ...current, checklists: [...current.checklists, { id: uid(), title, tasks: tasks.map((task) => ({ ...task, id: uid() })) }] })),
    renameChecklist: (listId, title) => setState((current) => ({ ...current, checklists: current.checklists.map((list) => list.id === listId ? { ...list, title } : list) })),
    toggleTask: (listId, taskId) => setState((current) => ({ ...current, checklists: current.checklists.map((list) => list.id !== listId ? list : { ...list, tasks: list.tasks.map((task) => task.id === taskId ? { ...task, done: !task.done } : task) }) })),
    addTask: (listId, title) => setState((current) => ({ ...current, checklists: current.checklists.map((list) => list.id !== listId ? list : { ...list, tasks: [...list.tasks, { id: uid(), title, done: false }] }) })),
    deleteTask: (listId, taskId) => setState((current) => ({ ...current, checklists: current.checklists.map((list) => list.id !== listId ? list : { ...list, tasks: list.tasks.filter((task) => task.id !== taskId) }) })),
    deleteChecklist: (listId) => setState((current) => ({ ...current, checklists: current.checklists.filter((list) => list.id !== listId) })),
  }), [hydrated, state]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useChecks() { const context = useContext(Context); if (!context) throw new Error('useChecks must be used inside ChecksProvider'); return context; }

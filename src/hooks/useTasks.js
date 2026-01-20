import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const TASKS_KEY = 'tasks_v1';

// Mock Tasks Data (Initial)
const INITIAL_TASKS = [
    { id: 1, text: 'Revisar presupuesto Q1', done: false, status: 'todo', date: new Date().toISOString() },
    { id: 2, text: 'Aprobar creativos de Coca-Cola', done: false, status: 'in_progress', date: new Date().toISOString() },
    { id: 3, text: 'Enviar reporte mensual', done: true, status: 'done', date: new Date().toISOString() }
];

const getTasks = async () => {
    const stored = localStorage.getItem(TASKS_KEY);
    return stored ? JSON.parse(stored) : INITIAL_TASKS;
};

const saveTasks = (tasks) => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    return tasks;
};

export const useTasks = () => {
    const queryClient = useQueryClient();

    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: getTasks,
        staleTime: Infinity // Tasks are local, no need to re-fetch often unless mutated
    });

    const addTaskMutation = useMutation({
        mutationFn: async (text) => {
            const current = await getTasks();
            const newTask = { 
                id: Date.now(), 
                text, 
                done: false, 
                status: 'todo', 
                date: new Date().toISOString() 
            };
            const updated = [newTask, ...current];
            saveTasks(updated);
            return updated;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(['tasks'], updated);
        }
    });

    const updateTaskMutation = useMutation({
        mutationFn: async ({ id, updates }) => {
            const current = await getTasks();
            const updated = current.map(t => t.id === id ? { ...t, ...updates } : t);
            saveTasks(updated);
            return updated;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(['tasks'], updated);
        }
    });

    const removeTaskMutation = useMutation({
        mutationFn: async (id) => {
            const current = await getTasks();
            const updated = current.filter(t => t.id !== id);
            saveTasks(updated);
            return updated;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(['tasks'], updated);
        }
    });

    const toggleTaskMutation = useMutation({
        mutationFn: async (id) => {
            const current = await getTasks();
            const updated = current.map(t => {
                if(t.id === id) {
                    const done = !t.done;
                    return { ...t, done, status: done ? 'done' : 'todo' };
                }
                return t;
            });
            saveTasks(updated);
            return updated;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(['tasks'], updated);
        }
    });

    return {
        tasks,
        addTask: addTaskMutation.mutate,
        updateTask: (id, updates) => updateTaskMutation.mutate({ id, updates }),
        removeTask: removeTaskMutation.mutate,
        toggleTask: toggleTaskMutation.mutate,
        isLoading: addTaskMutation.isPending || updateTaskMutation.isPending
    };
};

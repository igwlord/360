export interface Campaign {
  id: number;
  created_at?: string;
  name: string;
  client?: string;
  brand?: string; // Legacy support
  status: 'Planificación' | 'En Curso' | 'Pendiente' | 'Finalizado';
  type: string;
  date?: string;
  notes?: string;
  transactions?: Transaction[];
  providers?: string[]; // IDs of providers
  progress?: number;
  cost?: number; // Calculated field sometimes stored
}

export interface Transaction {
  id: string | number;
  date?: string;
  type: 'initial' | 'income' | 'expense';
  amount: number;
  note?: string;
  category?: string;
}

export interface Provider {
  id: string;
  company: string;
  service: string;
  phone?: string;
  email?: string;
}

export interface ProviderGroup {
  title: string;
  contacts: Provider[];
}

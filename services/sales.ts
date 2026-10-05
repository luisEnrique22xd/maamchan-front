import api from '@/lib/api';

export interface SaleItem {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Payment {
  id: number;
  amount: string;
  payment_method: string;
  reference?: string;
  notes?: string;
  created_at: string;
}

export interface Sale {
  id: number;
  seller_name: string;
  customer_name: string;
  sale_type: 'CONTADO' | 'CREDITO' | 'ANTICIPO';
  status: 'PENDIENTE' | 'PAGADO' | 'CANCELADO';
  total_amount: string;
  paid_amount: string;
  balance_due: string;
  items: SaleItem[];
  payments: Payment[];
  created_at: string;
}

export interface SalesFilterParams {
  status?: string;
  sale_type?: string;
  customer?: string;
  start_date?: string;
  end_date?: string;
}

export const salesService = {
  getSales: async (params?: SalesFilterParams): Promise<Sale[]> => {
    const response = await api.get<Sale[]>('/sales/', { params });
    return response.data;
  },

  getSaleById: async (id: number): Promise<Sale> => {
    const response = await api.get<Sale>(`/sales/${id}/`);
    return response.data;
  },

  addPayment: async (saleId: number, amount: number, method: string, reference?: string) => {
    const response = await api.post('/payments/', {
      sale: saleId,
      amount,
      payment_method: method,
      reference,
    });
    return response.data;
  }
};
// Domain Entity - Product
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductStock {
  productId: string;
  quantity: number;
}

// Domain Events
export type ProductEvent = 
  | { type: 'PRODUCT_CREATED'; payload: Product }
  | { type: 'STOCK_UPDATED'; payload: ProductStock }
  | { type: 'STOCK_DEPLETED'; payload: string };

export type CategoryId = 'tiffin' | 'starters' | 'mains' | 'breads' | 'drinks' | 'desserts';

export type Station = 'dosa' | 'tandoor' | 'curry' | 'fryer' | 'bar' | 'sweets';

export type DishShape = 'dosa' | 'idli' | 'bowl' | 'rice' | 'bread' | 'fry' | 'cup' | 'glass' | 'sweet';

export interface DishLook {
  shape: DishShape;
  base: string;
  accent: string;
  garnish: string;
}

export interface OptionChoice {
  id: string;
  label: string;
  price: number;
}

export interface OptionGroup {
  id: string;
  label: string;
  type: 'single' | 'multi';
  choices: OptionChoice[];
}

export interface MenuItem {
  id: string;
  name: string;
  localName?: string;
  description: string;
  category: CategoryId;
  price: number;
  veg: boolean;
  spice: 0 | 1 | 2 | 3;
  prepMins: number;
  station: Station;
  tags: ('bestseller' | 'chef' | 'new')[];
  available: boolean;
  look: DishLook;
  options?: OptionGroup[];
}

export interface Category {
  id: CategoryId;
  label: string;
  blurb: string;
}

export interface CartLine {
  key: string;
  itemId: string;
  qty: number;
  choices: OptionChoice[];
  note: string;
}

export type OrderMode = 'dine-in' | 'takeaway';

export interface DiningSession {
  mode: OrderMode;
  table: string;
}

export type OrderStatus =
  | 'paid'
  | 'billed'
  | 'queued'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'refunded';

export interface OrderLine {
  itemId: string;
  name: string;
  veg: boolean;
  station: Station;
  qty: number;
  unitPrice: number;
  choices: OptionChoice[];
  note: string;
  lineTotal: number;
}

export interface Totals {
  subtotal: number;
  packaging: number;
  cgst: number;
  sgst: number;
  roundOff: number;
  total: number;
}

export type PaymentMethod = 'upi' | 'card';

export interface PaymentInfo {
  method: PaymentMethod;
  reference: string;
  detail: string;
  paidAt: number;
}

export interface OrderEvent {
  status: OrderStatus;
  at: number;
  by: 'customer' | 'billing' | 'kitchen' | 'counter';
}

export interface Order {
  id: string;
  token: number;
  invoiceNo: string;
  createdAt: number;
  mode: OrderMode;
  table: string;
  customer: { name: string; phone: string };
  instructions: string;
  lines: OrderLine[];
  totals: Totals;
  payment: PaymentInfo;
  status: OrderStatus;
  events: OrderEvent[];
  etaMins: number;
}

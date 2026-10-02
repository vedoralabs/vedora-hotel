import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'Vedora Hotel — Order, pay & relax', loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage) },
  { path: 'menu', title: 'Menu · Vedora Hotel', loadComponent: () => import('./pages/menu/menu-page').then((m) => m.MenuPage) },
  { path: 'checkout', title: 'Checkout · Vedora Hotel', loadComponent: () => import('./pages/checkout/checkout-page').then((m) => m.CheckoutPage) },
  { path: 'order/:id', title: 'Your order · Vedora Hotel', loadComponent: () => import('./pages/order/order-page').then((m) => m.OrderPage) },
  { path: 'orders', title: 'My orders · Vedora Hotel', loadComponent: () => import('./pages/orders/orders-page').then((m) => m.OrdersPage) },
  { path: 'showcase', title: 'Behind the scenes · Vedora Hotel', loadComponent: () => import('./pages/showcase/showcase-page').then((m) => m.ShowcasePage) },
  { path: 'counter', title: 'Billing counter · Vedora Hotel', data: { staff: true }, loadComponent: () => import('./pages/counter/counter-page').then((m) => m.CounterPage) },
  { path: 'kitchen', title: 'Kitchen display · Vedora Hotel', data: { staff: true }, loadComponent: () => import('./pages/kitchen/kitchen-page').then((m) => m.KitchenPage) },
  { path: '**', redirectTo: '' },
];

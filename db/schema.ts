import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ─── Clients ───────────────────────────────────────────────────────
export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  address: text('address'),
  email: text('email'),
  phone: text('phone'),
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ─── Devis ─────────────────────────────────────────────────────────
export const quotes = sqliteTable('quotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quoteNumber: text('quote_number').notNull().unique(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  status: text('status', { enum: ['Brouillon', 'Envoyé', 'Signé', 'Refusé', 'Facturé'] }).default('Brouillon'),
  subtotal: real('subtotal').default(0),
  discount: real('discount').default(0),
  total: real('total').default(0),
  materials: text('materials'), // JSON string
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ─── Factures ──────────────────────────────────────────────────────
export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  quoteId: integer('quote_id').references(() => quotes.id),
  status: text('status', { enum: ['Brouillon', 'En attente', 'Partielle', 'Payée', 'En retard'] }).default('Brouillon'),
  total: real('total').default(0),
  amountPaid: real('amount_paid').default(0),
  balanceDue: real('balance_due').default(0),
  materials: text('materials'), // JSON string
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ─── Lignes de Prestation ──────────────────────────────────────────
export const lineItems = sqliteTable('line_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  docId: integer('doc_id').notNull(),
  docType: text('doc_type', { enum: ['quote', 'invoice'] }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  unitPrice: real('unit_price').notNull(),
  quantity: real('quantity').notNull(),
  total: real('total').notNull(),
});

// ─── Catalogue de Services ─────────────────────────────────────────
export const catalog = sqliteTable('catalog', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  defaultPrice: real('default_price').default(0),
});

// ─── Paiements ─────────────────────────────────────────────────────
export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
  amount: real('amount').notNull(),
  method: text('method', { enum: ['Espèces', 'Chèque', 'Virement', 'CB', 'Autre'] }).default('Virement'),
  notes: text('notes'),
  paidAt: integer('paid_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ─── Paramètres Entreprise ─────────────────────────────────────────
export const companySettings = sqliteTable('company_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyName: text('company_name').default(''),
  siret: text('siret').default(''),
  address: text('address').default(''),
  email: text('email').default(''),
  phone: text('phone').default(''),
  website: text('website').default(''),
  logoBase64: text('logo_base64'), // Base64 encoded logo image
  defaultNotes: text('default_notes').default(''),
});

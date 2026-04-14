import type {
  Order,
  InsertOrder,
  OrderItem,
  OrderItemLine,
  OrderAdditionalCharge,
} from "@shared/schema/order.schema";

// Project is an Order in the DB — the client-facing rename is cosmetic.
export type Project = Order;
export type InsertProject = InsertOrder;
export type ProjectItem = OrderItem;
export type ProjectItemLine = OrderItemLine;
export type ProjectItemCharge = OrderAdditionalCharge;

// Server-shaped response for `/api/projects/:id/items-with-details` — items
// joined with lines, additional charges, artwork. The exact shape is assembled
// server-side; callers can narrow with `useProjectItemsWithDetails<Concrete>()`
// when they need a sharper type. Note: the OrderItem table already has a string
// `charges` column, so we surface the joined relation as `additionalCharges`.
export type ProjectItemWithDetails = Omit<ProjectItem, "charges"> & {
  lines?: ProjectItemLine[];
  additionalCharges?: ProjectItemCharge[];
};

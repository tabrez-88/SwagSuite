# 📘 SwagSuite Order Management - Quick Reference Guide

## 🎯 Quick Start: How to Use the New Features

### 1️⃣ Creating an Order with Products

**Step 1: Create the Order**

1. Go to **Orders** page
2. Click **"Create Order"** button
3. Fill in:
   - Select **Customer**
   - Choose **Order Type** (Quote/Sales Order/Rush Order)
   - Enter **In-Hands Date** and **Event Date**
   - Add **Shipping Address** and **Billing Address**
   - Add any **Notes**
4. Click **Submit**

**Step 2: Add Products**

1. Click on the order to open **Order Details**
2. Click **"View Full Project"**
3. Go to **Products** tab
4. Click **"Add Product"**
5. Fill in product details:
   - Select **Product** from dropdown
   - Enter **Quantity**
   - Price auto-fills (or edit if needed)
   - Add **Color**, **Size**
   - Specify **Imprint Location** and **Method**
6. Click **"Add Product"**

### 2️⃣ Editing an Order

1. Click on any order in the **Orders** page
2. In the modal, click **"Edit Order"**
3. Make your changes
4. Click **Submit**

_Note: The modal title will show "Edit Order {ORDER-NUMBER}"_

### 3️⃣ Managing Products in an Order

**View Products:**

- Open order → View Full Project → **Products tab**
- See table with all products, quantities, prices

**Add More Products:**

- Click **"Add Product"** button in Products tab
- Fill form and submit

**Remove Products:**

- Click the 🗑️ trash icon next to any product
- Confirm deletion
- Product removed instantly

**See Order Total:**

- Bottom of products table shows **Grand Total**
- Auto-calculates from all line items

### 4️⃣ Creating Products (Fixed!)

1. Go to **Products** page
2. Click **"Add Product"** or **"Search Products"**
3. **Important**: Select a **Supplier** from dropdown
4. Fill in product details
5. Click **Create**

_Previously this would fail - now works perfectly!_

### 5️⃣ Production Report (Real Data!)

1. Go to **Production Report** page
2. See **actual orders** from database (no more fake data!)
3. Each order shows:
   - Company name
   - Products (with count if multiple)
   - Assigned user
   - Production stage
   - Progress %
   - Due date
   - Tracking number (if shipped)

**View Modes:**

- **Cards View**: Visual kanban-style
- **List View**: Detailed table

### 6️⃣ Project Page Features

Navigate to any order's Project page to access:

**📋 Overview Tab:**

- Post comments
- @ mention team members
- See activity timeline
- System-generated events

**📦 Products Tab:** _(NEW!)_

- View all products
- Add new products
- Remove products
- See order total

**📁 Files Tab:**

- Upload files (coming soon)
- Attach artwork, mockups, etc.

**⏰ Timeline Tab:**

- Full chronological history
- All changes and updates

## 🔍 Common Workflows

### Workflow 1: Quote to Sales Order

1. Create order as **"Quote"** type
2. Add products in Project → Products tab
3. Send quote to customer (manual for now)
4. When approved:
   - Edit order
   - Change type to **"Sales Order"**
   - Update status to **"Approved"**

### Workflow 2: Rush Order Processing

1. Create order with type **"Rush Order"**
2. Set **In-Hands Date** (< 7 days triggers rush indicator)
3. Add products quickly
4. Production Report will show as **"Urgent"** priority
5. Track through stages

### Workflow 3: Tracking Production

1. Check **Production Report** page
2. Orders automatically mapped to stages:
   - Quote → Sales Order Booked
   - Pending Approval → PO Placed
   - Approved → Proof Received
   - In Production → Order Placed
   - Shipped → Shipped stage
3. Click on any order to see details
4. Click **project icon** to manage products

## 💡 Pro Tips

### Keyboard Shortcuts (Future)

- `Ctrl + N`: New order (coming soon)
- `Ctrl + P`: New product (coming soon)

### Data Entry Tips

1. **Addresses**: Use full addresses including ZIP for shipping accuracy
2. **Product Pricing**: Price auto-fills from product database, edit if special pricing
3. **Quantities**: Minimum 1, no decimals
4. **Colors/Sizes**: Free text - be consistent for reporting

### Best Practices

1. **Always add shipping address** when creating orders
2. **Add products immediately** after order creation
3. **Use Project page** for ongoing order management
4. **Check Production Report** daily for status updates
5. **Update order status** as work progresses

## 🚨 Troubleshooting

### "Failed to create product"

**Solution**: Make sure you selected a **Supplier** from the dropdown

### "Product not showing in order"

**Solution**:

1. Check you clicked "Add Product"
2. Refresh the page
3. Check Products tab in Project page

### "Can't edit order address"

**Solution**:

1. Click "Edit Order" button
2. Addresses are now in the form
3. Update and submit

### "Production Report shows no data"

**Solution**:

1. Make sure you have created orders
2. Check they have a status (quote, approved, etc.)
3. Refresh the page

### "Order total doesn't match"

**Solution**:

1. Order total is calculated from **all order items**
2. Check Products tab to see breakdown
3. Add/remove products to adjust

## 📊 Understanding Order Statuses

| Status               | Meaning              | Next Action      |
| -------------------- | -------------------- | ---------------- |
| **Quote**            | Initial estimate     | Send to customer |
| **Pending Approval** | Awaiting customer OK | Follow up        |
| **Approved**         | Customer confirmed   | Start production |
| **In Production**    | Being manufactured   | Track progress   |
| **Shipped**          | On the way           | Provide tracking |
| **Delivered**        | Customer received    | Close order      |
| **Cancelled**        | Order cancelled      | Archive          |

## 🎨 UI Elements Guide

### Badges

- **Blue** = Quote
- **Yellow** = Pending/In Progress
- **Green** = Approved/Complete
- **Red** = Cancelled/Rush
- **Purple** = In Production

### Icons

- 📦 = Products
- 🚚 = Shipping
- 📝 = Notes/Details
- ✏️ = Edit
- 🗑️ = Delete
- ➕ = Add New
- 👁️ = View
- 📊 = Reports

## 🔐 Permissions (Future)

Currently all authenticated users can:

- ✅ View all orders
- ✅ Create orders
- ✅ Edit orders
- ✅ Add/remove products
- ✅ View production report

Future role-based permissions coming soon!

## 📞 Support

If you encounter issues:

1. Check this guide first
2. Check IMPROVEMENT_SUMMARY.md for technical details
3. Contact development team
4. Report bugs via your issue tracker

---

**Last Updated**: December 28, 2025
**Version**: 2.0 (Complete Order Management Overhaul)

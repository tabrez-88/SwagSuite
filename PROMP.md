```
PAGES to Include:
Dashboard - The dashboard will be the home screen of the system. It should be able to be customized by each user. Some of the items that should be available on the dashboard are:
Team KPI Leaderboard
Finances
Year to Date, Last Year to Date, Month to Date, Last Month to Date, Week to Date, Current Day, or Custom by date
Revenue
Margin %
Order Revenue avg
Order Quantity
Pipeline from Hubspot
Invoicing - how much owed, how much over 60 days, 90 days or custom date range
Slack integration - team integrated slack on the dashboard page
Customer and Vendor Breaking News - Using AI to scan the web for any noteworthy news about vendors or customers make a running scrawl with that information.
For customers/companies send notices through email and system notification to the salesperson associated with that client. Also draft auto messages about that news.
CRM - The CRM should have a direct integration with Hubspot. When something gets input in either location, it real-time syncs to the other.
Customers - All customer data fields should be available, including the option for multiple addresses, and should sync with a company,
Track customer spend and create a running YTD total on the customer page. Also have a custom date report

Leads
Allowing for integrations with Apollo.ai, Zoominfo
New outreach or follow up outreach directly through the customer page of the crm using AI drafts and follow ups.
AI should be looking at the customer data and order history to suggest items or reminders about possible recurring events.
AI should also make suggestions based on similar companies' orders throughout the system.
Allow the ability to create marketing sequences (like in Hubspot) directly in the system.
AI generation for these sequences should be built in. Also should be looking for any new relevant news online about the customer or company and add that information to the autodrafts.
Vendors
Allow for vendors to be created manually or imported from ASI/ESP and Sage.
Ability to automate messages to vendors. For example “An order was sent and 1 day later we have not yet received confirmation of that order, auto draft and notify the csr to send an AI generated note to vendor
Auto draft and email to a vendor contact when we match last year to date spending and also when we hit 50% and 100% more with them in the next year and ask for additional benefits (rebates, EQP+, free selfpromos, free shipping, etc).. Then notify the Vendors Relations Director when those targets are met so they can send and approve the autodraft emails.
Create a space for Preferred vendors and on that page allow for notes about what we get from those preferred vendors (EQP, Rebates, self-promos, etc)
Orders - This is the main area for placing and tracking all orders. All items should be brought in through the integration with ESP/ASI, Sage, Distributor Cental, API keys or added manually. You can start at any stage in the orders section to produce a sale. Every order should also include an overview page which has a text box for additional information that can be shared by the team to each other. You can also “tag” another coworker about the project by @name and they will receive an email and notification.
Products - add a new product. Can either add an existing product through search of ASI/ESP, SAGE, Distributor Cenral search or create a new product.
If there are duplicates of products recommend less expensive options
Quotes - Creat a quote from the products page
Sales Orders - Sales orders will be sent to the client for approval. When an approval comes back as positive it will tag in the production lead and also put it onto a kanban board for the production team (CSR) to take it and place the purchase orders to the vendors.
Sales orders need to have all the typical information and:
IHD (only seen by the customer on the purchase order and in the system),, Supplier IHD (only seen by the supplier on the purchase order and in the system), Customer EVENT DATE,
A place for additional information
When a sales order is being built take the information from the product and the artwork to build a mock-up of the item they are requesting. For example, 3001CVC tshirt in Navy with the attached logo in pms color #243U should preview that item as the image for the sales order.
Products to come in from ESP API
Artwork proofing - every order should include a proofing stage that should be added as a step, sent to the client for approval, and once approved the sales rep, production rep should receive a notification and email.
If the person does not approve the proof within 1 business day automate a follow-up email requesting approval. Continue doing this and flag the reps involved. Prompt the rep to include for future auto requests for approval to include information about a delay or missing in hands date. Request of the reps that information each cycle unless they un...
```

```
we need to integrate the products with ESP/ASI/Sage for product details and pricing (https://developers.asicentral.com/)
```

```
connect slack to this Access Token [REMOVED - Use environment variable SLACK_ACCESS_TOKEN]
```

```
Create a function to upload our exsiting data in the settings section. Files to include are xls, csv, google drive, pdf, .ai, word, etc. Please review that info with AI and create the correct clients and orders list, with associated revenue, etc.
```

```
Please create a new page for the sidebar called "Production Report". The production report will show all the items in orders that are currently in production and what stage they are in. The production report should be able to be customized for next actions with next action date as a custom field. The next action date should notify the producion rep assigned every day of what they have to do. The steps in the production report are: Sales Order Booked, Purchase Order placed, Confirmation received from vendor, Proof received from vendor, proof approved by client, order placed, invoice paid by customer, shipping scheduled for date, shipped, and next action. These steps should also be changeable and rearrangeable and allow additional steps to be created. The steps should easy to see visually where every order sits in what stage and what step has been completed. If someone clicks on an order in the production report it should popup a box with the entire order and that should be able to be filled out inside the production report and carry that information over to the orders page.
```

```
Allow for inputing information into the production report either when the order is pulled up or in the production report itself. For example. Shipped - be able to write in the tracking number. Next step - be able to have a custom message
```

```
Please create a new page for the sidebar called "Artwork". On the Artwork page please make it a kanban view and similar to Trello. The columns should be PMS Colors, Artist Schedule, Artwork to Do, In Progress, Questions and clarifications, For Review, Sent to Client, and Completed. Also, allow for additional columns to be created. Please replicate Trello's functionality. Allow for artwork "cards" to be tied to a customer and order
```

```
The artwork page does not seem to have anything on it. Please recreate it to work like a kanban trello board like in the image. Creating preset columns:The columns should be PMS Colors, Artist Schedule, Artwork to Do, In Progress, Questions and clarifications, For Review, Sent to Client, and Completed. Also, allow for additional columns to be created. Please replicate Trello's functionality. Allow for artwork "cards" to be tied to a customer and order
```

```
on the artwork page. Please keep the sidebar from the rest of the software to the left. Also in the cards please allow files to be uploaded. including .ai, eps., jpeg, png, pdf etc. Show a preview as an image for the card.
```

```
Allow clicking into the artboard cards to make edits
```

```
allow for edits of the attached files as well in the artwork
```

```
Create a page in the side bar called Mock-up Builder - Mock-up Builder - this page should be very simple to use. The goal is to add the product number with the information coming from ESP/ASI or Sage and show that product. Then they should be able to insert a logo (can be any file, .ai, .eps, jpeg, png, pdf etc) and that logo should go onto the image of the product. Then they should be able to move or resize the logo for it to fit correctly. Also the mock up builder should be able to change the color of the logo by adding in PMS, Hex or selecting colors. You should also be able to remove the background of the image if necessary.
The mock up builder should allow easy download or email straight from the builder page and should flow into the client folder or client order if the salesperson identifies that.
The mock up builder should also allow for a template that has a header and footer that can be created company wide
It should also offer a customer version template with the customer logo on the top along with our company logo. This should be created with AI and suggested
```

```
please make a search bar at the top of each page that uses natural language and AI to search the entire system to find the answer. For example "what are the last three orders and what are the margins?" or "i need the .ai file for the Beber logo"
```

```
Add a new page to the side bar called AI Presentation Builder - The goal of this page is to create a presentation of products based on deal notes. THose can be added natively on the page or imported from hubspot deal notes. Please allow files to be imported (including .ai, eps, jpeg, png, pdf, etc.). This should suggest products based on pricing, quantites, items, etc.
```

```
Allow products to be imported from S&S Activewear using their API Key
```

```
This does not need to be on the sidebar, but part of the products page. It looks like the connection did not work.

Here is the API key: 1812622b-59cd-4863-8a9f-ad64eee5cd22

account number is 52733
```

```
It does not seem to work. I want to be able to hit add product and put the product number in and for all the details to pull up fromS&S Activewear for that product.
```

```
On the dashboard page and also on the products page add section that says most popular item sold. Allow for that to toggle between Week to Date, Year to Date, and Month to Date, as well as a custom date field. This field should be populated by the number of orders placed with that product number and should list the product number, quantity ordered, and image of the product. Have two ,most popular sections one for apparel and one for "hard goods" (non apparel items).
```

```
To both of those pages in the most popular items section also add a "suggested items" section. pupulate that with items, either apparel or hard goods, that are in a lot of presentations but have not yet been sold. Also allow for admin in settings to add certain products to that list with any discounts or rebates. Also please show pictures of the products throughout the "most popular items" section

Have each section scrollable to 10 items

they should scroll verticly showing the top 10 items not horizontially. Also allow for the item to be "clicked" on and taken to that product page. In the suggested section allow the presentations link to be clicked on as well.

allow for verical scrolling in the popular apparel and hard goods section, and the suggested apparel and suggested hard goods in each module . I want to see 3 at first glance but able to scroll verticly to see #4 on the list through #10
```

```
allow in the settings area the following system wide options for admin level: 1. change the logo in the left corner with a jpeg, png or pdf logo. 2. Change the system colors. 3. Change what fields need to be in the sales orders, purchase orders, sections. 4. Allow for mass data import with AI reviewing the data and sorting that information to rebuild closed orders (including customer data, company data, artwork, purchase orders, overviews, sales orders, estimates, quotes, proofing, etc.)
```

```
In the CRM section, when adding a new client or company, please allow the addition of links to their social media (like linkedIn, twitter, facebook, or other) then when you click into the client or customer page you see their most recent posts. Flag any item that says "excitng news" and add that to the News & Alerts section of the dashbaord
```

```
Every week send all users an email that gives them a report of their week:
How many orders placed
How much revenue
Margin %
New Stores Built
Additional items can be added for the system by the admin in the settings section.
```

```
Create a new page that is on the Sidebar called Sequence Builder. Create a new page that is on the Sidebar called Sequence Builder. Design and build a page that mimics the "Sequence Builder" sales automation tool from HubSpot. The application should allow users to create, edit, manage, and track personalized email outreach sequences along with related tasks and reminders. The sequence builder could generate AI sales sequences for a new clients, existing clients, or using general information. This page should also analyze the sequence open rate, meeting rate,and interaction rate, and sales orders closed rate. Use AI to suggest flow but allow for the user to make from scratch if they would like.
```

```
Each order is a "project" and should have it's own project page within the order. On the project page, there needs to be an "overview" that shows everything that has happened in that project. This should look like a social media page timeline showing who took the action and what it was. At the top of the overview there should be a text box and you can type or tag in others in the company by writing @ and there name and that will send them a notification. this will also be added to the overview timeline.


when in the popup allow anything to be clicked to see the rest of the project or order. Also allow tagging for internal communication and sending emails to clients or vendors straight from this popup
```

```
in the popular items section of the dashboard page allow for AI search and have a search bar. For example what tumblers are our best selling with 100 qty and for it to pull up the information. Allow for that item to be clicked into to see all the data coming from the integrations with our vendors S&S, SanMar, ESP, Sage, etc.
```

```
Please separate out the perferred vendors to be their own tab. On that tab list the preffered vendors using both card or list option. Make them clickable. WHen clicking in you should be able to see what we get from those prefered vendors (eqp pricing, rebate %, free setups, free or reduced spec samples, free or reduced self promo, etc). There should also be trackable along with YTD spend allow for How much have we saved by using EQP with this vendor, YTD rebates, self promos sent, and spec samples sent.
```

```
Create an Errors section. The errors should be tied to orders and have fields for: Date, Prject Number, Error tyles (with a dropdown of Pricing, in-hands date, shipping, printing, other, artwork/proofing, OOS), Client name, Vendor Name, Responsible Party (customer, vendor LSD), Resolution (Refund, Credit for Future order, reprint, courier/shipping, other), Cost to LSD, production rep, Order Rep, Client Rep, additional notes. The items in parentesis should be available as drop down selection. The errors section should be tied to KPIs and the orders and should be able to see reports based on this information.


On the errors page allow for YTD, MTD and custom date field along with comparisons to LYTD, LMTD, and Last Year
```

```
Create a new section on the left sidebar called Newsletter. The Newsletter is a cloud-based email marketing application inspired by MailChimp and Constant Contact. The app should allow users to:

Register, log in, and manage subscriber lists with advanced segmentation tools for targeted campaigns.

Design emails using a drag-and-drop visual editor and choose from a template gallery.

Set up automated campaigns (like drip sequences, birthdays, and RSS-to-email newsletters).

Monitor performance with dashboards for open rates, click rates, conversions, and A/B testing.

Create signup forms, surveys, and landing pages to grow and engage audiences.

Integrate with social media and e-commerce platforms for contact sync and campaign sharing.

Use AI for creative email design suggestions and better campaign optimization.

Enable mobile-friendly management with responsive interfaces.

Include role-based access so teams can collaborate.

Deploy reliably with built-in hosting and user authentication.

Tools/features to include: authentication, database for contacts, WYSIWYG email editor, automation engine, reporting module, integrations for third-party platforms, survey builder, landing page builder, responsive UI.
```

### Integrations ⚙️ Partial

| Integration         | Status     | Details                                                                |
| :------------------ | :--------- | :--------------------------------------------------------------------- |
| Slack               | ✅ Real    | shared/slack.ts with WebClient, send/read messages, channel management |
| S&S Activewear      | ✅ Real    | ssActivewearService.ts with full API implementation, 515 lines         |
| SendGrid            | ✅ Real    | Email sending for mockup builder                                       |
| Anthropic AI        | ✅ Real    | Claude integration throughout app                                      |
| HubSpot             | ⚙️ Mock    | Routes exist (/api/integrations/hubspot/\*) with simulated responses   |
| SAGE                | ⚙️ Mock    | Route exists (/api/integrations/sage/products) returning sample data   |
| ESP                 | ⚙️ Mock    | Route exists (/api/integrations/esp/products) returning sample data    |
| Distributor Central | ⚙️ Mock    | Route exists (/api/integrations/dc/products) returning sample data     |
| QuickBooks          | ❌ Missing | No evidence in codebase                                                |
| Stripe              | ❌ Missing | No evidence in codebase                                                |

# SwagSuite Database Schema Breakdown

Comprehensive documentation of the PostgreSQL database schema managed via Drizzle ORM.

## System Overview

| Component        | Details                           |
| :--------------- | :-------------------------------- |
| **Database**     | PostgreSQL (Neon Serverless)      |
| **ORM**          | Drizzle ORM                       |
| **Schema File**  | `shared/schema.ts` (~1,436 lines) |
| **Total Tables** | 52                                |

---

## 1. Authentication & Users

| Table          | Purpose                     | Key Fields                                                        |
| :------------- | :-------------------------- | :---------------------------------------------------------------- |
| **`sessions`** | Replit Auth session storage | `sid`, `sess`, `expire`                                           |
| **`users`**    | User accounts & RBAC        | `id`, `email`, `role` (user/admin/manager), `emailReportsEnabled` |

## 2. CRM - Customer Management

| Table           | Purpose                      | Key Fields                                                        |
| :-------------- | :--------------------------- | :---------------------------------------------------------------- |
| **`companies`** | Primary B2B entities         | `name`, `ytdSpend`, `hubspotId`, `socialMediaLinks`, `newsAlerts` |
| **`contacts`**  | Individuals within companies | `companyId`, `firstName`, `lastName`, `email`, `isPrimary`        |
| **`clients`**   | Standalone client records    | `email`, `industry`, `totalSpent`, `accountManager`               |

## 3. Suppliers & Products

| Table                      | Purpose                  | Key Fields                                                       |
| :------------------------- | :----------------------- | :--------------------------------------------------------------- |
| **`suppliers`**            | Vendor management        | `name`, `isPreferred`, `ytdSpend`, `preferredBenefits`, `sageId` |
| **`products`**             | Internal product catalog | `supplierId`, `categoryId`, `sku`, `basePrice`, `imageUrl`       |
| **`espProducts`**          | ESP cache                | `asiNumber`, `productName`, `decorationMethods`                  |
| **`sageProducts`**         | SAGE cache               | `sageId`, `eqpLevel`, `pricingStructure`                         |
| **`ssActivewearProducts`** | S&S catalog              | `sku`, `styleId`, `brandName`, `piecePrice`, `qty`               |

## 4. Orders & Fulfillment

| Table              | Purpose                 | Key Fields                                                             |
| :----------------- | :---------------------- | :--------------------------------------------------------------------- |
| **`orders`**       | Core transaction entity | `orderNumber`, `status`, `orderType`, `total`, `margin`, `inHandsDate` |
| **`orderItems`**   | Line items              | `orderId`, `productId`, `quantity`, `unitPrice`, `imprintMethod`       |
| **`artworkFiles`** | Asset management        | `orderId`, `companyId`, `fileName`, `filePath`, `mimeType`             |

## 5. Production Workflow

| Table                    | Purpose                  | Key Fields                                                       |
| :----------------------- | :----------------------- | :--------------------------------------------------------------- |
| **`artworkColumns`**     | Kanban board structure   | `name`, `position`, `color`                                      |
| **`artworkCards`**       | Kanban tasks             | `columnId`, `orderId`, `priority`, `dueDate`, `attachments`      |
| **`productionTracking`** | Order lifecycle tracking | `orderId`, `currentStageId`, `nextActionDate`, `completedStages` |

## 6. Sales & Marketing Automation

| Table                       | Purpose                | Key Fields                                                         |
| :-------------------------- | :--------------------- | :----------------------------------------------------------------- |
| **`sequences`**             | HubSpot-style outreach | `name`, `status`, `totalSteps`, `automation%`                      |
| **`sequenceSteps`**         | Sequence actions       | `type` (email/task/call), `position`, `content`, `delayDays`       |
| **`newsletterCampaigns`**   | Email marketing        | `subject`, `listId`, `status`, `opens`, `clicks`, `abTestSettings` |
| **`newsletterSubscribers`** | Subscriber database    | `email`, `status`, `tags`, `engagementScore`                       |

## 7. AI & Analytics

| Table               | Purpose              | Key Fields                                                 |
| :------------------ | :------------------- | :--------------------------------------------------------- |
| **`presentations`** | AI-generated decks   | `dealNotes`, `suggestedProducts`, `slides`, `status`       |
| **`errors`**        | KPI & issue tracking | `errorType`, `responsibleParty`, `resolution`, `costToLsd` |
| **`kpiMetrics`**    | Time-series data     | `metricType`, `period`, `value`, `target`                  |
| **`knowledgeBase`** | RAG for AI search    | `content`, `category`, `searchVector`                      |

---

## Key Relationship Logic

### Order Flow

`companies` ➔ `orders` ➔ `orderItems` ➔ `products` ➔ `suppliers`

### Production Flow

`orders` ➔ `productionTracking` ➔ `productionStages`
`orders` ➔ `artworkCards` ➔ `artworkColumns`

### Integration Mapping

- **HubSpot**: Linked via `hubspotId` in `companies` and `presentations`.
- **Suppliers**: Linked via `espId`, `sageId`, and `distributorCentralId`.
- **Users**: Act as `assignedUserId`, `uploadedBy`, or `createdBy` across all modules.

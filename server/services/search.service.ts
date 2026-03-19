import { companyRepository } from "../repositories/company.repository";
import { productRepository } from "../repositories/product.repository";
import { orderRepository } from "../repositories/order.repository";

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
  url: string;
}

export class SearchService {
  async aiSearch(query: string): Promise<SearchResult[]> {
    const searchTerm = query.toLowerCase();
    const results: SearchResult[] = [];

    const companies = await companyRepository.getAll();
    const companyMap = new Map(companies.map(c => [c.id, c.name]));

    // Search orders
    const orders = await orderRepository.getOrders();
    const matchingOrders = orders.filter(order => {
      const customerName = order.companyId ? companyMap.get(order.companyId) : '';
      return customerName?.toLowerCase().includes(searchTerm) ||
        order.orderNumber?.toLowerCase().includes(searchTerm) ||
        order.status?.toLowerCase().includes(searchTerm);
    }).slice(0, 3);

    for (const order of matchingOrders) {
      const customerName = order.companyId ? companyMap.get(order.companyId) : 'Unknown Customer';
      results.push({
        id: order.id,
        type: "order",
        title: `Order #${order.orderNumber}`,
        description: `${customerName} - ${order.status}`,
        metadata: {
          value: `$${Number(order.total).toFixed(2)}`,
          status: order.status || 'unknown',
          date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''
        },
        url: `/orders`
      });
    }

    // Search products
    const products = await productRepository.getAll();
    const matchingProducts = products.filter(product => {
      return product.name?.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.sku?.toLowerCase().includes(searchTerm);
    }).slice(0, 3);

    for (const product of matchingProducts) {
      results.push({
        id: product.id,
        type: "product",
        title: product.name,
        description: product.description || 'No description available',
        metadata: {
          value: `$${Number(product.basePrice || 0).toFixed(2)}`,
        },
        url: `/products`
      });
    }

    // Search companies
    const matchingCompanies = companies.filter(company => {
      return company.name?.toLowerCase().includes(searchTerm) ||
        company.industry?.toLowerCase().includes(searchTerm) ||
        company.website?.toLowerCase().includes(searchTerm);
    }).slice(0, 3);

    for (const company of matchingCompanies) {
      results.push({
        id: company.id,
        type: "company",
        title: company.name,
        description: `${company.industry || 'Unknown industry'} - ${company.website || 'No website'}`,
        metadata: {},
        url: `/crm`
      });
    }

    // Handle natural language queries for margins
    if (searchTerm.includes('margin') && searchTerm.includes('order')) {
      const ordersWithMargins = orders.filter(order => Number(order.total) > 0)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 3);

      for (const order of ordersWithMargins) {
        const total = Number(order.total);
        const margin = (total * 0.25);
        const customerName = order.companyId ? companyMap.get(order.companyId) : 'Unknown Customer';
        results.push({
          id: `margin-${order.id}`,
          type: "order",
          title: `Order #${order.orderNumber} (Margin Analysis)`,
          description: `${customerName} - Recent order with margin data`,
          metadata: {
            value: `$${total.toFixed(2)}`,
            margin: `$${margin.toFixed(2)} (25%)`,
            date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''
          },
          url: `/orders`
        });
      }
    }

    // Handle file searches
    if (searchTerm.includes('.ai') || searchTerm.includes('logo') || searchTerm.includes('file')) {
      results.push({
        id: 'artwork-files',
        type: "file",
        title: "Artwork Files",
        description: "Search through artwork files and logos in the artwork management system",
        metadata: {},
        url: `/artwork`
      });
    }

    return results.slice(0, 8);
  }
}

export const searchService = new SearchService();

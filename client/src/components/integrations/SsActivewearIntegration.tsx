import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, Download, Search, Package } from 'lucide-react';
import type { SsActivewearImportJob, SsActivewearProduct } from '@shared/schema';

export function SsActivewearIntegration() {
  const [accountNumber, setAccountNumber] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch import jobs
  const { data: importJobs, isLoading: loadingJobs } = useQuery<SsActivewearImportJob[]>({
    queryKey: ['/api/ss-activewear/import-jobs'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch products
  const { data: products, isLoading: loadingProducts } = useQuery<SsActivewearProduct[]>({
    queryKey: ['/api/ss-activewear/products'],
  });

  // Search products
  const { data: searchResults, isLoading: searching } = useQuery<SsActivewearProduct[]>({
    queryKey: ['/api/ss-activewear/search', { q: searchQuery }],
    enabled: searchQuery.length > 2,
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async ({ accountNumber, apiKey }: { accountNumber: string; apiKey: string }) => {
      const response = await apiRequest('POST', '/api/ss-activewear/test-connection', { accountNumber, apiKey });
      return response;
    },
    onSuccess: (data: any) => {
      if (data.connected) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to S&S Activewear API",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to connect to S&S Activewear API. Please check your credentials.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Connection Error",
        description: "Failed to test connection to S&S Activewear API",
        variant: "destructive",
      });
    },
  });

  // Import products mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ss-activewear/import', { accountNumber, apiKey, styleFilter: styleFilter || undefined });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Import Started",
        description: "Product import has been started. You can monitor the progress below.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ss-activewear/import-jobs'] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: "Failed to start product import",
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = () => {
    if (!accountNumber.trim() || !apiKey.trim()) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both account number and API key",
        variant: "destructive",
      });
      return;
    }
    testConnectionMutation.mutate({ accountNumber, apiKey });
  };

  const handleImport = () => {
    if (!accountNumber.trim() || !apiKey.trim()) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both account number and API key",
        variant: "destructive",
      });
      return;
    }
    importMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Running</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return 'N/A';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">S&S Activewear Integration</h2>
        <p className="text-gray-600">Import products from S&S Activewear using your API credentials.</p>
      </div>

      {/* Connection Settings */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Enter your S&S Activewear API credentials. You can find these in your S&S account settings or contact api@ssactivewear.com.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                type="text"
                placeholder="Enter your S&S account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="styleFilter">Style Filter (Optional)</Label>
            <Input
              id="styleFilter"
              type="text"
              placeholder="e.g., 00760, Gildan 5000, bella + canvas 3001cvc"
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              Filter by style ID, part number, or brand name. Leave empty to import all products.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleTestConnection}
              disabled={testConnectionMutation.isPending}
              variant="outline"
            >
              {testConnectionMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Test Connection
            </Button>
            
            <Button
              onClick={handleImport}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Start Import
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
          <CardDescription>Monitor your recent product import jobs.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingJobs ? (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>Loading import jobs...</p>
            </div>
          ) : !importJobs?.length ? (
            <p className="text-gray-500 text-center py-4">No import jobs found.</p>
          ) : (
            <div className="space-y-4">
              {importJobs.map((job) => (
                <div key={job.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(job.status)}
                        <span className="text-sm text-gray-500">
                          {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      {job.errorMessage && (
                        <p className="text-sm text-red-600 mt-1">{job.errorMessage}</p>
                      )}
                    </div>
                  </div>
                  
                  {job.status === 'running' && job.totalProducts && job.totalProducts > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{job.processedProducts || 0} / {job.totalProducts}</span>
                      </div>
                      <Progress 
                        value={((job.processedProducts || 0) / job.totalProducts) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                  
                  {job.status === 'completed' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Total Products</p>
                        <p className="font-medium">{job.totalProducts}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">New Products</p>
                        <p className="font-medium text-green-600">{job.newProducts}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Updated Products</p>
                        <p className="font-medium text-blue-600">{job.updatedProducts}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Errors</p>
                        <p className="font-medium text-red-600">{job.errorCount}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Search & Catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Catalog
            {products?.length && (
              <Badge variant="secondary">{products.length} products</Badge>
            )}
          </CardTitle>
          <CardDescription>Search and browse imported S&S Activewear products.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products by SKU, brand, style, or color..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {searching && (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p>Searching products...</p>
              </div>
            )}

            {searchQuery.length > 2 && searchResults ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{product.brandName} {product.styleName}</h4>
                        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {product.qty || 0} in stock
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-500">Color:</span> {product.colorName}</p>
                      <p><span className="text-gray-500">Size:</span> {product.sizeName}</p>
                      <p><span className="text-gray-500">Price:</span> {formatCurrency(product.customerPrice)}</p>
                    </div>
                    
                    {product.colorSwatchImage && (
                      <div className="mt-3">
                        <img 
                          src={`https://www.ssactivewear.com/${product.colorSwatchImage}`}
                          alt={`${product.colorName} swatch`}
                          className="w-8 h-8 rounded border"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              searchQuery.length <= 2 && !loadingProducts && products && products.length > 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {products.length} products imported. Use the search above to browse them.
                  </p>
                </div>
              )
            )}

            {!loadingProducts && (!products || products.length === 0) && (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No products imported yet. Start an import to populate the catalog.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
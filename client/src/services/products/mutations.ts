import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { productKeys } from "./keys";
import * as requests from "./requests";

export function useCreateProduct() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => requests.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast({ title: "Success", description: "Product added successfully" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add product", variant: "destructive" }),
  });
}

export function useUpdateProduct() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Record<string, any> }) => requests.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast({ title: "Success", description: "Product updated successfully" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update product", variant: "destructive" }),
  });
}

export function useDeleteProduct() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => requests.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast({ title: "Success", description: "Product deleted successfully" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete product", variant: "destructive" }),
  });
}

export function useSearchSSActivewear() {
  return useMutation({
    mutationFn: (query: string) => requests.searchSSActivewear(query),
  });
}

export function useSearchSage() {
  return useMutation({
    mutationFn: (query: string) => requests.searchSage(query),
  });
}

export function useSearchSanMar() {
  return useMutation({
    mutationFn: (query: string) => requests.searchSanMar(query),
  });
}

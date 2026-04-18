import { useMutation } from "@tanstack/react-query";
import * as requests from "./requests";

export function usePreviewImport<T = any>() {
  return useMutation({ mutationFn: (file: File) => requests.previewImport<T>(file) });
}

export function useImportCsv<T = any>() {
  return useMutation({
    mutationFn: ({
      entity,
      file,
      mapping,
    }: {
      entity: "companies" | "contacts";
      file: File;
      mapping: Record<string, string>;
    }) => requests.importCsv<T>(entity, file, mapping),
  });
}

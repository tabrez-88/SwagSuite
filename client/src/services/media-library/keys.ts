export const mediaLibraryKeys = {
  all: ["/api/media-library"] as const,
  list: (params: string) => ["/api/media-library", params] as const,
};

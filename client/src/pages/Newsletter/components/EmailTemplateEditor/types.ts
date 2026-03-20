export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  previewText: string;
  htmlContent: string;
  thumbnailUrl: string;
  category: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EditorElement {
  id: string;
  type: "text" | "image" | "button" | "divider" | "columns";
  content: {
    text?: string;
    imageUrl?: string;
    buttonText?: string;
    buttonUrl?: string;
    style?: any;
  };
}

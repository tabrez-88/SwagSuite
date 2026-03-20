export interface SanMarProduct {
    styleId: string;
    styleName: string;
    brandName: string;
    productTitle: string;
    productDescription: string;
    categoryName: string;
    availableSizes: string;
    caseSize: number;
    pieceWeight?: number;

    // Pricing
    casePrice?: number;
    caseSalePrice?: number;
    dozenPrice?: number;
    dozenSalePrice?: number;
    piecePrice?: number;
    pieceSalePrice?: number;
    priceCode?: string;
    priceText?: string;
    saleStartDate?: string;
    saleEndDate?: string;

    // Arrays
    colors: string[];
    sizes: string[];

    // Images
    productImage?: string;
    colorProductImage?: string;
    frontModel?: string;
    backModel?: string;
    sideModel?: string;
    frontFlat?: string;
    backFlat?: string;
    thumbnailImage?: string;
    brandLogoImage?: string;
    specSheet?: string;

    // Other
    keywords?: string;
    productStatus?: string;
}

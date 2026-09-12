export interface Vendor {
  _id: string;
  name: string;
  vendorCode: string;
  contactEmail: string | null;
  contactPhone: string | null;
  country: string;
  businessUnits: (string | { _id: string; name: string; code: string })[];
  riskRating: 'Low' | 'Medium' | 'High' | null;
  activeContractsCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

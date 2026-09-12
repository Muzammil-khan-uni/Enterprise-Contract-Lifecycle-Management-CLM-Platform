export interface BusinessUnit {
  _id: string;
  name: string;
  code: string;
  parentUnit: string | { _id: string; name: string; code: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  businessUnit: string | { _id: string; name: string; code: string };
  headOfDept: string | null;
  createdAt: string;
  updatedAt: string;
}

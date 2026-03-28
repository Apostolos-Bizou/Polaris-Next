// ─── Base Entity ─────────────────────────────────────────
export interface BaseEntity {
  id: string;
  _ts?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Client (εταιρεία-πελάτης) ───────────────────────────
export interface Client extends BaseEntity {
  type: "client";
  name: string;
  taxId: string;
  industry: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  status: "active" | "inactive" | "prospect";
  contractStart: string;
  contractEnd: string;
}

// ─── Member (ασφαλισμένο μέλος) ──────────────────────────
export interface Member extends BaseEntity {
  type: "member";
  clientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "M" | "F" | "Other";
  employeeId: string;
  email: string;
  phone: string;
  planType: "basic" | "standard" | "premium";
  status: "active" | "suspended" | "terminated";
  enrollmentDate: string;
  terminationDate?: string;
}

// ─── Claim (αίτημα αποζημίωσης) ─────────────────────────
export interface Claim extends BaseEntity {
  type: "claim";
  clientId: string;
  memberId: string;
  claimNumber: string;
  serviceDate: string;
  submissionDate: string;
  providerName: string;
  providerType: "hospital" | "clinic" | "pharmacy" | "lab" | "dental" | "optical";
  diagnosis: string;
  icdCode: string;
  amountBilled: number;
  amountApproved: number;
  amountPaid: number;
  currency: "EUR" | "USD";
  status: "submitted" | "under_review" | "approved" | "rejected" | "paid";
  rejectionReason?: string;
}

// ─── Dashboard KPIs ─────────────────────────────────────
export interface DashboardKPIs {
  totalClients: number;
  activeClients: number;
  totalMembers: number;
  activeMembers: number;
  totalClaims: number;
  pendingClaims: number;
  totalPremiums: number;
  totalClaimsPaid: number;
  lossRatio: number;
  averageClaimAmount: number;
  claimsByStatus: Record<string, number>;
  claimsByMonth: Array<{
    month: string;
    submitted: number;
    paid: number;
    amount: number;
  }>;
  topClients: Array<{
    id: string;
    name: string;
    members: number;
    claims: number;
    lossRatio: number;
  }>;
}

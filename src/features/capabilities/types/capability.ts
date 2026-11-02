export type IndustryProfile = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

export type EffectiveCapability = {
  id: string;
  code: string;
  name: string;
  module: string;
  scope: "Business" | "Outlet";
  enabled: boolean;
  businessEnabled: boolean;
  profileDefault: boolean | null;
  businessOverride: boolean | null;
  outletOverride: boolean | null;
  source: string;
  canOverride: boolean;
};

export type CapabilitySnapshot = {
  businessId: string;
  outletId: string | null;
  revision: number;
  industryProfile: IndustryProfile;
  capabilities: EffectiveCapability[];
};

export type CapabilityOverrideItem = {
  code: string;
  enabled: boolean | null;
};

export type CapabilityChangeLog = {
  id: string;
  outletId: string | null;
  outletName: string | null;
  capabilityCode: string | null;
  capabilityName: string | null;
  changeType: string;
  oldValue: boolean | null;
  newValue: boolean | null;
  reason: string | null;
  changedByUserId: string;
  changedByUserName: string;
  createdAt: string;
};

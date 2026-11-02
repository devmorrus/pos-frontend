// Types untuk public storefront outlets — dari GET /api/public/outlets
export interface PublicOutlet {
  id: string;
  businessSlug: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
}

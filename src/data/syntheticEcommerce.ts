export interface SyntheticOrder {
  orderId: string;
  orderDate: string;
  orderMonth: string;
  region: "North" | "South" | "East" | "West";
  category: "Hardware" | "Software" | "Services" | "Accessories";
  channel: "Organic" | "Paid Search" | "Partner" | "Email";
  customerSegment: "Small Business" | "Mid Market" | "Enterprise";
  revenue: number;
  cost: number;
  units: number;
  returned: boolean;
}

export const syntheticOrders: SyntheticOrder[] = [
  {
    orderId: "SO-1001",
    orderDate: "2026-01-04",
    orderMonth: "2026-01",
    region: "North",
    category: "Hardware",
    channel: "Organic",
    customerSegment: "Small Business",
    revenue: 12400,
    cost: 7700,
    units: 18,
    returned: false
  },
  {
    orderId: "SO-1002",
    orderDate: "2026-01-11",
    orderMonth: "2026-01",
    region: "West",
    category: "Software",
    channel: "Paid Search",
    customerSegment: "Mid Market",
    revenue: 18300,
    cost: 6900,
    units: 24,
    returned: false
  },
  {
    orderId: "SO-1003",
    orderDate: "2026-01-20",
    orderMonth: "2026-01",
    region: "East",
    category: "Services",
    channel: "Partner",
    customerSegment: "Enterprise",
    revenue: 22200,
    cost: 14200,
    units: 9,
    returned: false
  },
  {
    orderId: "SO-1004",
    orderDate: "2026-02-02",
    orderMonth: "2026-02",
    region: "South",
    category: "Accessories",
    channel: "Email",
    customerSegment: "Small Business",
    revenue: 7600,
    cost: 4100,
    units: 31,
    returned: false
  },
  {
    orderId: "SO-1005",
    orderDate: "2026-02-08",
    orderMonth: "2026-02",
    region: "North",
    category: "Software",
    channel: "Organic",
    customerSegment: "Enterprise",
    revenue: 26800,
    cost: 9400,
    units: 26,
    returned: false
  },
  {
    orderId: "SO-1006",
    orderDate: "2026-02-19",
    orderMonth: "2026-02",
    region: "West",
    category: "Services",
    channel: "Partner",
    customerSegment: "Mid Market",
    revenue: 19600,
    cost: 12100,
    units: 11,
    returned: false
  },
  {
    orderId: "SO-1007",
    orderDate: "2026-03-03",
    orderMonth: "2026-03",
    region: "East",
    category: "Hardware",
    channel: "Paid Search",
    customerSegment: "Enterprise",
    revenue: 31500,
    cost: 19800,
    units: 21,
    returned: false
  },
  {
    orderId: "SO-1008",
    orderDate: "2026-03-14",
    orderMonth: "2026-03",
    region: "South",
    category: "Software",
    channel: "Email",
    customerSegment: "Mid Market",
    revenue: 24100,
    cost: 8500,
    units: 27,
    returned: false
  },
  {
    orderId: "SO-1009",
    orderDate: "2026-03-24",
    orderMonth: "2026-03",
    region: "West",
    category: "Accessories",
    channel: "Organic",
    customerSegment: "Small Business",
    revenue: 9800,
    cost: 5200,
    units: 42,
    returned: true
  },
  {
    orderId: "SO-1010",
    orderDate: "2026-04-05",
    orderMonth: "2026-04",
    region: "North",
    category: "Services",
    channel: "Partner",
    customerSegment: "Enterprise",
    revenue: 35200,
    cost: 21400,
    units: 14,
    returned: false
  },
  {
    orderId: "SO-1011",
    orderDate: "2026-04-17",
    orderMonth: "2026-04",
    region: "East",
    category: "Software",
    channel: "Paid Search",
    customerSegment: "Mid Market",
    revenue: 28700,
    cost: 10300,
    units: 29,
    returned: false
  },
  {
    orderId: "SO-1012",
    orderDate: "2026-04-27",
    orderMonth: "2026-04",
    region: "South",
    category: "Hardware",
    channel: "Organic",
    customerSegment: "Small Business",
    revenue: 16600,
    cost: 10100,
    units: 16,
    returned: false
  },
  {
    orderId: "SO-1013",
    orderDate: "2026-05-04",
    orderMonth: "2026-05",
    region: "West",
    category: "Software",
    channel: "Partner",
    customerSegment: "Enterprise",
    revenue: 40200,
    cost: 14500,
    units: 35,
    returned: false
  },
  {
    orderId: "SO-1014",
    orderDate: "2026-05-16",
    orderMonth: "2026-05",
    region: "North",
    category: "Accessories",
    channel: "Email",
    customerSegment: "Small Business",
    revenue: 11800,
    cost: 6300,
    units: 48,
    returned: false
  },
  {
    orderId: "SO-1015",
    orderDate: "2026-05-25",
    orderMonth: "2026-05",
    region: "East",
    category: "Services",
    channel: "Organic",
    customerSegment: "Enterprise",
    revenue: 33100,
    cost: 20400,
    units: 13,
    returned: false
  },
  {
    orderId: "SO-1016",
    orderDate: "2026-06-01",
    orderMonth: "2026-06",
    region: "South",
    category: "Software",
    channel: "Paid Search",
    customerSegment: "Mid Market",
    revenue: 36200,
    cost: 12900,
    units: 32,
    returned: false
  },
  {
    orderId: "SO-1017",
    orderDate: "2026-06-12",
    orderMonth: "2026-06",
    region: "West",
    category: "Hardware",
    channel: "Partner",
    customerSegment: "Enterprise",
    revenue: 29800,
    cost: 18400,
    units: 20,
    returned: false
  },
  {
    orderId: "SO-1018",
    orderDate: "2026-06-23",
    orderMonth: "2026-06",
    region: "East",
    category: "Accessories",
    channel: "Email",
    customerSegment: "Small Business",
    revenue: 13600,
    cost: 7200,
    units: 55,
    returned: false
  }
];


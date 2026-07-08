export const regions = ["Singapore", "Malaysia", "Thailand", "Indonesia"] as const;
export const channels = ["Organic", "Paid Search", "Social", "Affiliate"] as const;
export const categories = ["Electronics", "Beauty", "Home", "Fashion", "Groceries"] as const;

export type Region = (typeof regions)[number];
export type Channel = (typeof channels)[number];
export type Category = (typeof categories)[number];

export interface OrderRow {
  order_id: string;
  order_date: string;
  customer_id: string;
  product_id: string;
  region: Region;
  channel: Channel;
  category: Category;
  revenue: number;
  discount_amount: number;
  quantity: number;
  campaign_id: string | null;
}

export interface TrafficRow {
  date: string;
  region: Region;
  channel: Channel;
  sessions: number;
  product_views: number;
  add_to_cart: number;
  checkout_started: number;
  orders: number;
}

export interface CampaignRow {
  campaign_id: string;
  campaign_name: string;
  start_date: string;
  end_date: string;
  region: Region;
  channel: Channel;
  budget: number;
  campaign_type: "Always On" | "Seasonal" | "Launch" | "Retention";
}

export interface ProductRow {
  product_id: string;
  category: Category;
  product_name: string;
  unit_cost: number;
  launch_date: string;
}

export interface CustomerMaskedRow {
  customer_id: string;
  customer_segment: "New" | "Returning" | "Loyal";
  region: Region;
  signup_date: string;
  is_sensitive_masked: boolean;
}

export interface RefundRow {
  refund_id: string;
  order_id: string;
  refund_date: string;
  refund_amount: number;
  refund_reason: "Damaged Item" | "Late Delivery" | "Changed Mind" | "Duplicate Order";
}

export interface ExperimentEventRow {
  event_date: string;
  experiment_id: "EXP-FUNNEL-01" | "EXP-CHECKOUT-02";
  variant: "Control" | "Treatment";
  region: Region;
  channel: Channel;
  sessions: number;
  pdp_views: number;
  add_to_cart: number;
  checkout_started: number;
  orders: number;
  gmv: number;
  active_users: number;
}

export interface SyntheticOrder {
  orderId: string;
  orderDate: string;
  orderMonth: string;
  region: Region;
  category: Category;
  channel: Channel;
  customerSegment: CustomerMaskedRow["customer_segment"];
  revenue: number;
  cost: number;
  units: number;
  returned: boolean;
}

const startDate = new Date("2026-01-01T00:00:00.000Z");
const dayCount = 186;
const revenueDropStart = "2026-06-17";
const revenueDropEnd = "2026-06-23";
const refundSpikeStart = "2026-05-14";
const refundSpikeEnd = "2026-05-20";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function dateRange() {
  return Array.from({ length: dayCount }, (_, index) => isoDate(addDays(startDate, index)));
}

function isBetween(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

function hashString(value: string) {
  return Array.from(value).reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) % 100000;
  }, 17);
}

function dailyVariation(date: string, seed: string) {
  const dayIndex = Math.floor(
    (new Date(`${date}T00:00:00.000Z`).getTime() - startDate.getTime()) / 86400000
  );
  const weeklyWave = Math.sin((dayIndex / 7) * Math.PI * 2) * 0.08;
  const deterministicNoise = ((hashString(`${date}-${seed}`) % 17) - 8) / 100;
  return 1 + weeklyWave + deterministicNoise;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getCampaignId(date: string, region: Region, channel: Channel) {
  const campaign = campaigns.find(
    (candidate) =>
      candidate.region === region &&
      candidate.channel === channel &&
      date >= candidate.start_date &&
      date <= candidate.end_date
  );

  return campaign?.campaign_id ?? null;
}

export const products: ProductRow[] = [
  {
    product_id: "P001",
    category: "Electronics",
    product_name: "Demo Wireless Hub",
    unit_cost: 88,
    launch_date: "2025-10-01"
  },
  {
    product_id: "P002",
    category: "Electronics",
    product_name: "Demo Smart Lamp",
    unit_cost: 34,
    launch_date: "2025-11-15"
  },
  {
    product_id: "P003",
    category: "Beauty",
    product_name: "Demo Daily Serum",
    unit_cost: 16,
    launch_date: "2025-09-20"
  },
  {
    product_id: "P004",
    category: "Beauty",
    product_name: "Demo Refill Kit",
    unit_cost: 12,
    launch_date: "2025-12-05"
  },
  {
    product_id: "P005",
    category: "Home",
    product_name: "Demo Storage Set",
    unit_cost: 23,
    launch_date: "2025-08-12"
  },
  {
    product_id: "P006",
    category: "Home",
    product_name: "Demo Desk Organizer",
    unit_cost: 19,
    launch_date: "2025-10-23"
  },
  {
    product_id: "P007",
    category: "Fashion",
    product_name: "Demo Travel Tote",
    unit_cost: 29,
    launch_date: "2025-09-01"
  },
  {
    product_id: "P008",
    category: "Fashion",
    product_name: "Demo Active Jacket",
    unit_cost: 42,
    launch_date: "2025-11-01"
  },
  {
    product_id: "P009",
    category: "Groceries",
    product_name: "Demo Pantry Box",
    unit_cost: 14,
    launch_date: "2025-07-15"
  },
  {
    product_id: "P010",
    category: "Groceries",
    product_name: "Demo Snack Pack",
    unit_cost: 8,
    launch_date: "2025-12-18"
  }
];

export const campaigns: CampaignRow[] = [
  {
    campaign_id: "C001",
    campaign_name: "Demo Regional Growth Sprint",
    start_date: "2026-02-10",
    end_date: "2026-03-09",
    region: "Singapore",
    channel: "Paid Search",
    budget: 42000,
    campaign_type: "Seasonal"
  },
  {
    campaign_id: "C002",
    campaign_name: "Demo Social Launch",
    start_date: "2026-03-20",
    end_date: "2026-04-16",
    region: "Malaysia",
    channel: "Social",
    budget: 36000,
    campaign_type: "Launch"
  },
  {
    campaign_id: "C003",
    campaign_name: "Demo Affiliate Boost",
    start_date: "2026-05-05",
    end_date: "2026-06-01",
    region: "Thailand",
    channel: "Affiliate",
    budget: 28000,
    campaign_type: "Always On"
  },
  {
    campaign_id: "C004",
    campaign_name: "Demo Retention Push",
    start_date: "2026-06-10",
    end_date: "2026-06-30",
    region: "Indonesia",
    channel: "Organic",
    budget: 18000,
    campaign_type: "Retention"
  }
];

export const customers_masked: CustomerMaskedRow[] = Array.from(
  { length: 240 },
  (_, index) => {
    const region = regions[index % regions.length];
    const segmentIndex = index % 3;

    return {
      customer_id: `M-CUST-${String(index + 1).padStart(4, "0")}`,
      customer_segment: segmentIndex === 0 ? "New" : segmentIndex === 1 ? "Returning" : "Loyal",
      region,
      signup_date: isoDate(addDays(new Date("2025-01-01T00:00:00.000Z"), index * 3)),
      is_sensitive_masked: true
    };
  }
);

export const traffic: TrafficRow[] = dateRange().flatMap((date) => {
  return regions.flatMap((region, regionIndex) => {
    return channels.map((channel, channelIndex) => {
      const channelMultiplier = [1.12, 0.94, 0.86, 0.72][channelIndex];
      const regionMultiplier = [1.18, 1.05, 0.96, 0.9][regionIndex];
      const dropMultiplier = isBetween(date, revenueDropStart, revenueDropEnd) ? 0.62 : 1;
      const sessions = Math.max(
        80,
        Math.round(
          520 *
            channelMultiplier *
            regionMultiplier *
            dailyVariation(date, `${region}-${channel}`) *
            dropMultiplier
        )
      );
      const product_views = Math.round(sessions * (1.8 + channelIndex * 0.08));
      const add_to_cart = Math.round(product_views * (0.16 + regionIndex * 0.01));
      const checkout_started = Math.round(add_to_cart * (0.58 - channelIndex * 0.025));
      const orders = Math.max(
        1,
        Math.round(checkout_started * (0.48 + regionIndex * 0.018 - channelIndex * 0.01))
      );

      return {
        date,
        region,
        channel,
        sessions,
        product_views,
        add_to_cart,
        checkout_started,
        orders
      };
    });
  });
});

export const orders: OrderRow[] = traffic.flatMap((trafficRow, trafficIndex) => {
  const productOffset = hashString(
    `${trafficRow.date}-${trafficRow.region}-${trafficRow.channel}`
  );
  const sampledOrderCount = Math.max(1, Math.round(trafficRow.orders / 18));

  return Array.from({ length: sampledOrderCount }, (_, orderIndex) => {
    const product = products[(productOffset + orderIndex) % products.length];
    const customer =
      customers_masked[(trafficIndex * 7 + orderIndex * 13) % customers_masked.length];
    const dropMultiplier = isBetween(trafficRow.date, revenueDropStart, revenueDropEnd)
      ? 0.72
      : 1;
    const quantity = 1 + ((productOffset + orderIndex) % 4);
    const categoryMultiplier = 1 + categories.indexOf(product.category) * 0.09;
    const channelMultiplier = 1 + channels.indexOf(trafficRow.channel) * 0.045;
    const listPrice = product.unit_cost * (2.2 + categoryMultiplier + channelMultiplier);
    const discount_amount = roundCurrency(
      listPrice * quantity * (trafficRow.channel === "Paid Search" ? 0.11 : 0.06)
    );
    const revenue = roundCurrency(
      Math.max(12, listPrice * quantity * dailyVariation(trafficRow.date, product.product_id) * dropMultiplier)
    );

    return {
      order_id: `O-${trafficRow.date.replaceAll("-", "")}-${String(trafficIndex).padStart(
        4,
        "0"
      )}-${String(orderIndex + 1).padStart(2, "0")}`,
      order_date: trafficRow.date,
      customer_id: customer.customer_id,
      product_id: product.product_id,
      region: trafficRow.region,
      channel: trafficRow.channel,
      category: product.category,
      revenue,
      discount_amount,
      quantity,
      campaign_id: getCampaignId(trafficRow.date, trafficRow.region, trafficRow.channel)
    };
  });
});

export const refunds: RefundRow[] = orders
  .map((order, index) => {
    const refundChance = isBetween(order.order_date, refundSpikeStart, refundSpikeEnd) ? 22 : 4;
    const shouldRefund = hashString(`${order.order_id}-refund`) % 100 < refundChance;

    if (!shouldRefund) {
      return undefined;
    }

    const refundDelay = 1 + (hashString(`${order.order_id}-delay`) % 9);
    const refundDate = isoDate(addDays(new Date(`${order.order_date}T00:00:00.000Z`), refundDelay));
    const refundReasons: RefundRow["refund_reason"][] = [
      "Damaged Item",
      "Late Delivery",
      "Changed Mind",
      "Duplicate Order"
    ];

    return {
      refund_id: `R-${String(index + 1).padStart(5, "0")}`,
      order_id: order.order_id,
      refund_date: refundDate,
      refund_amount: roundCurrency(order.revenue * (0.35 + (index % 5) * 0.1)),
      refund_reason: refundReasons[index % refundReasons.length]
    };
  })
  .filter((refund): refund is RefundRow => Boolean(refund));

export const experiment_events: ExperimentEventRow[] = dateRange().flatMap((date) => {
  const experiments: ExperimentEventRow["experiment_id"][] = [
    "EXP-FUNNEL-01",
    "EXP-CHECKOUT-02"
  ];
  const variants: ExperimentEventRow["variant"][] = ["Control", "Treatment"];

  return experiments.flatMap((experiment_id, experimentIndex) => {
    return variants.flatMap((variant, variantIndex) => {
      return regions.flatMap((region, regionIndex) => {
        return channels.map((channel, channelIndex) => {
          const baseSessions =
            420 *
            (1 + regionIndex * 0.06) *
            (1 - channelIndex * 0.04) *
            dailyVariation(date, `${experiment_id}-${variant}-${region}-${channel}`);
          const treatmentLift = variant === "Treatment" ? 1.04 + experimentIndex * 0.03 : 1;
          const dropMultiplier = isBetween(date, revenueDropStart, revenueDropEnd) ? 0.7 : 1;
          const sessions = Math.max(60, Math.round(baseSessions * treatmentLift * dropMultiplier));
          const pdp_views = Math.round(sessions * (1.55 + variantIndex * 0.03));
          const add_to_cart = Math.round(pdp_views * (0.17 + variantIndex * 0.015));
          const checkout_started = Math.round(add_to_cart * (0.56 + variantIndex * 0.02));
          const orders = Math.round(checkout_started * (0.46 + variantIndex * 0.025));
          const gmv = roundCurrency(orders * (78 + regionIndex * 6 + experimentIndex * 9));

          return {
            event_date: date,
            experiment_id,
            variant,
            region,
            channel,
            sessions,
            pdp_views,
            add_to_cart,
            checkout_started,
            orders,
            gmv,
            active_users: Math.round(sessions * 0.72)
          };
        });
      });
    });
  });
});

const productById = new Map(products.map((product) => [product.product_id, product]));
const customerById = new Map(customers_masked.map((customer) => [customer.customer_id, customer]));
const refundedOrderIds = new Set(refunds.map((refund) => refund.order_id));

export const syntheticOrders: SyntheticOrder[] = orders.map((order) => {
  const product = productById.get(order.product_id);
  const customer = customerById.get(order.customer_id);

  return {
    orderId: order.order_id,
    orderDate: order.order_date,
    orderMonth: order.order_date.slice(0, 7),
    region: order.region,
    category: order.category,
    channel: order.channel,
    customerSegment: customer?.customer_segment ?? "Returning",
    revenue: order.revenue,
    cost: roundCurrency((product?.unit_cost ?? 10) * order.quantity),
    units: order.quantity,
    returned: refundedOrderIds.has(order.order_id)
  };
});

export const syntheticEcommerce = {
  orders,
  traffic,
  campaigns,
  products,
  customers_masked,
  refunds,
  experiment_events
};

export const syntheticDataNotes = {
  dateRange: {
    start: isoDate(startDate),
    end: isoDate(addDays(startDate, dayCount - 1)),
    days: dayCount
  },
  intentionalRevenueDropPeriod: {
    start: revenueDropStart,
    end: revenueDropEnd
  },
  refundSpikePeriod: {
    start: refundSpikeStart,
    end: refundSpikeEnd
  },
  incompleteLatestWeek: {
    latestAvailableDate: isoDate(addDays(startDate, dayCount - 1)),
    note: "The final synthetic week intentionally has fewer than 7 available days."
  }
};


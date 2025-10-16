// services/vendorDetect.ts
type MatchConf = { keys: string[] };

const vendorConf: MatchConf = {
  keys: [
    "vendor","vendor_name","vend_name","vendornm",
    "organization","org","entity","name","company","company_name",
    "supplier","supplier_name","supplier_account","supplier_nm",
    "account","account_name","bp_name","business_partner","partner","counterparty",
    "sold_to_name","ship_to_name","hq_name","legal_name"
  ],
};

const cityConf: MatchConf = {
  keys: [
    "city","city_name","city_updated","city_","municipality","town","location",
    "region","comm_name","community","census_subdivision","comm_name_updated",
    "shipping_city","billing_city","bill_to_city","ship_to_city","sold_to_city",
    "mailingcity","billingcity","shippingcity","hq_city","headquarters_city"
  ],
};

const provConf: MatchConf = {
  keys: [
    "province","province_name","province_name_updated","prov","region",
    "state","state_code","stateabbr","stateprovince","st",
    "shipping_state","billing_state","bill_to_state","ship_to_state","sold_to_state",
    "mailingstate","billingstate","shippingstate","hq_state","headquarters_state"
  ],
};

function scoreName(nameLc: string, baseKeys: string[]): number {
  let best = 0;
  for (const k of baseKeys) {
    if (!nameLc.includes(k)) continue;
    let s = 0;
    if (nameLc === k) s += 3;
    else s += 2; // contains
    if (nameLc.includes("final")) s += 4;     // highest priority
    if (/_val(\b|$)/.test(nameLc) || nameLc.endsWith("val")) s += 2; // next priority
    if (/(verified|validated|clean)/.test(nameLc)) s += 1;
    best = Math.max(best, s);
  }
  return best;
}

function pickBest(columns: string[], conf: MatchConf): string | null {
  let bestCol: string | null = null;
  let bestScore = 0;
  for (const col of columns) {
    const s = scoreName(col.toLowerCase(), conf.keys);
    if (s > bestScore) {
      bestScore = s;
      bestCol = col;
    }
  }
  return bestScore > 0 ? bestCol : null;
}

export function detectVendorColumn(columns: string[]): string | null {
  // Explicit fast-path for common FINAL / _VAL forms
  const lower = columns.map((c) => c.toLowerCase());
  const prefer = [
    "vendor_final","final_vendor","vendorname_final","final_vendor_name",
    "organization_final","final_organization","supplier_final","final_supplier",
    "company_final","final_company","entity_final","final_entity",
    "vendor_val","vendor_name_val","organization_val","supplier_val","company_val","entity_val",
  ];
  for (const p of prefer) {
    const i = lower.findIndex((c) => c === p || c.includes(p));
    if (i >= 0) return columns[i];
  }
  return pickBest(columns, vendorConf);
}

const cityPrefer = [
  "city_final","final_city","city_name_final","final_city_name","city_val","city_name_val",
  "shipping_city_final","billing_city_final","mailingcity_final","shippingcity_final","billingcity_final"
];

const provPrefer = [
  "province_final","final_province","state_final","final_state","prov_final","final_prov",
  "province_val","state_val","prov_val","billing_state_final","shipping_state_final","mailingstate_final"
];

export function detectCityProvinceColumns(columns: string[]): { city: string | null; province: string | null } {
  const lower = columns.map((c) => c.toLowerCase());
  let city: string | null = null;
  let province: string | null = null;

  for (const p of cityPrefer) {
    const i = lower.findIndex((c) => c === p || c.includes(p));
    if (i >= 0) { city = columns[i]; break; }
  }
  for (const p of provPrefer) {
    const i = lower.findIndex((c) => c === p || c.includes(p));
    if (i >= 0) { province = columns[i]; break; }
  }

  if (!city) city = pickBest(columns, cityConf);
  if (!province) province = pickBest(columns, provConf);
  return { city, province };
}

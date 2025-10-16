import { z } from "zod";

export const VisualType = z.enum([
  "plotly_bar",
  "plotly_pie",
  "table",
  "map_osm",
  "form_contact",
  "download",
  "image",
  "contact_card",
  "insight_card",
  "website_card",
]);

export const ActionKind = z.enum(["visual", "note", "side_effect"]);

export const TablePayload = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.array(z.any())),
  title: z.string().optional(),
});

export const PlotlyBarPayload = z.object({
  x: z.array(z.union([z.string(), z.number()])),
  y: z.array(z.number()),
  title: z.string().optional(),
});

export const PlotlyPiePayload = z.object({
  labels: z.array(z.union([z.string(), z.number()])),
  values: z.array(z.number()),
  title: z.string().optional(),
});

export const MapOSMPayload = z.object({
  geojson: z.any(), // GeoJSON
  fit: z.enum(["bounds", "center"]).optional(),
});

export const FormContactPayload = z.object({
  title: z.string().optional(),
  fields: z.array(
    z.object({
      name: z.string(),
      label: z.string(),
      type: z.enum(["text", "email", "tel", "textarea"]),
      required: z.boolean().optional(),
    })
  ),
  submitUrl: z.string().url().optional(),
});

export const DownloadPayload = z.object({
  filename: z.string(),
  mime: z.string(),
  dataBase64: z.string(),
});

export const ImagePayload = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
});


export const ContactCardPayload = z.object({
  fullName: z.string(),
  title: z.string().optional(),
  org: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  note: z.string().optional(),
});

export const InsightCardPayload = z.object({
  heading: z.string().optional(),
  insights: z.array(z.object({
    title: z.string(),
    value: z.union([z.string(), z.number()])
  })),
  cta: z.string().optional(),
  imageUrl: z.string().url().optional(),
  seedKey: z.string().optional(),
});

export const WebsiteCardPayload = z.object({
  website: z.string().url(),
  title: z.string().optional(),
});

export const SuggestionPayload = z.object({
  next: z.string().optional(),
  option_type: z.enum([
    "buttons", "select", "number", "range", "date", "datetime",
    "toggle", "map_point", "map_bbox", "year", "rating",
    "table_row_select", "input"
  ]).optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  schema: z.any().optional(),
});

export const VisualPayloadByType: Record<
  z.infer<typeof VisualType>,
    z.ZodTypeAny
  > = {
  plotly_bar: PlotlyBarPayload,
  plotly_pie: PlotlyPiePayload,
  table: TablePayload,
  map_osm: MapOSMPayload,
  form_contact: FormContactPayload,
  download: DownloadPayload,
  image: ImagePayload,
  contact_card: ContactCardPayload,
  insight_card: InsightCardPayload,
  website_card: WebsiteCardPayload,
};

export const ActionBase = z.object({
  v: z.literal(1),
  refId: z.string(), 
  kind: ActionKind,
  title: z.string().optional(),
  meta: z
    .object({
      source: z.string().optional(),
      tool: z.string().optional(),
      latency_ms: z.number().optional(),
    })
    .optional(),
});

// visual action
export const VisualAction = ActionBase.extend({
  kind: z.literal("visual"),
  type: VisualType,
  payload: z.any(),
}).superRefine((val, ctx) => {
  const schema = VisualPayloadByType[val.type];
  const r = schema.safeParse(val.payload);
  if (!r.success) {
    r.error.issues.forEach((i) =>
      ctx.addIssue({ code: "custom", message: `payload: ${i.message}` })
    );
  }
});

// note / side_effect (no panel render)
export const NoteAction = ActionBase.extend({
  kind: z.enum(["note", "side_effect"]),
  type: z.string().optional(), // Add type field for suggestions
  payload: z.any().optional(),
}).superRefine((val, ctx) => {
  // If it's a suggestion note, validate the payload
  if (val.type === "suggestions") {
    const r = SuggestionPayload.safeParse(val.payload);
    if (!r.success) {
      r.error.issues.forEach((i) =>
        ctx.addIssue({ code: "custom", message: `suggestion payload: ${i.message}` })
      );
    }
  }
});

export const ActionSchema = z.union([VisualAction, NoteAction]);

export type Action = z.infer<typeof ActionSchema>;
export type VisualActionT = z.infer<typeof VisualAction>;

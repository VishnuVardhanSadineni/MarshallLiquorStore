import PDFDocument from "pdfkit";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderItem = {
  product_name: string;
  product_sku: string;
  unit_price_cents: number;
  quantity: number;
};

type Order = {
  order_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  pickup_notes: string | null;
  status: string;
  subtotal_cents: number;
  created_at: string;
  order_items: OrderItem[];
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  ready: "Ready for pickup",
  picked_up: "Picked up",
  cancelled: "Cancelled",
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ order_number: string }> },
) {
  const { order_number } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("orders")
    .select(
      "order_number, first_name, last_name, phone, pickup_notes, status, subtotal_cents, created_at, order_items(product_name, product_sku, unit_price_cents, quantity)",
    )
    .eq("order_number", order_number)
    .single();

  if (error || !data) {
    return new Response("Order not found", { status: 404 });
  }

  const order = data as unknown as Order;
  const pdfBuffer = await renderOrderPdf(order);

  return new Response(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${order.order_number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

function renderOrderPdf(order: Order): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 54,
      font: "Helvetica",
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#1a1a1a")
      .text("Marshall Liquor Store", { align: "center" });
    doc.moveDown(0.15);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#666")
      .text(
        "613 Locust St, Suite A  ·  Marshall, IL 62441  ·  (618) 707-5250",
        { align: "center" },
      );
    doc.moveDown(1.2);

    // Rule
    doc
      .moveTo(54, doc.y)
      .lineTo(558, doc.y)
      .strokeColor("#e6e0d6")
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.8);

    // Order block
    doc.font("Helvetica").fontSize(10).fillColor("#666");
    doc.text("ORDER", { continued: true });
    doc.text("   " + new Date(order.created_at).toLocaleString(), {
      align: "right",
    });

    doc.moveDown(0.2);
    doc.font("Helvetica-Bold").fontSize(20).fillColor("#1a1a1a");
    doc.text(order.order_number);
    doc.moveDown(0.5);

    // Two-column details
    const detailsTop = doc.y;
    const colWidth = 240;
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#666");
    doc.text("CUSTOMER", 54, detailsTop);
    doc.font("Helvetica").fontSize(11).fillColor("#1a1a1a");
    doc.text(`${order.first_name} ${order.last_name}`, 54, detailsTop + 14);
    doc.fontSize(10).fillColor("#333").text(order.phone, 54, detailsTop + 30);

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#666");
    doc.text("STATUS", 54 + colWidth + 20, detailsTop);
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#1a1a1a")
      .text(
        STATUS_LABELS[order.status] ?? order.status,
        54 + colWidth + 20,
        detailsTop + 14,
      );

    doc.y = detailsTop + 56;

    if (order.pickup_notes) {
      doc.moveDown(0.4);
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#666").text("PICKUP NOTES");
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#333")
        .text(order.pickup_notes, { width: 504 });
    }

    doc.moveDown(1);

    // Items table
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#666");
    const tableTop = doc.y;
    doc.text("ITEM", 54, tableTop);
    doc.text("SKU", 300, tableTop);
    doc.text("QTY", 400, tableTop, { width: 40, align: "right" });
    doc.text("UNIT", 445, tableTop, { width: 55, align: "right" });
    doc.text("TOTAL", 505, tableTop, { width: 53, align: "right" });

    doc.moveDown(0.3);
    doc
      .moveTo(54, doc.y)
      .lineTo(558, doc.y)
      .strokeColor("#e6e0d6")
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(10).fillColor("#1a1a1a");
    for (const item of order.order_items) {
      const rowTop = doc.y;
      const lineTotal = item.unit_price_cents * item.quantity;
      doc.text(item.product_name, 54, rowTop, { width: 240 });
      doc.text(item.product_sku, 300, rowTop, { width: 95 });
      doc.text(String(item.quantity), 400, rowTop, {
        width: 40,
        align: "right",
      });
      doc.text(money(item.unit_price_cents), 445, rowTop, {
        width: 55,
        align: "right",
      });
      doc.text(money(lineTotal), 505, rowTop, {
        width: 53,
        align: "right",
      });
      doc.moveDown(0.7);
    }

    doc.moveDown(0.4);
    doc
      .moveTo(54, doc.y)
      .lineTo(558, doc.y)
      .strokeColor("#e6e0d6")
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.7);

    // Subtotal
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#1a1a1a");
    doc.text("Subtotal", 54, doc.y, { continued: true });
    doc.text(money(order.subtotal_cents), { align: "right" });

    doc.moveDown(0.3);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#666")
      .text(
        "Tax and any additional fees calculated at pickup. Pay in store.",
        { align: "right" },
      );

    // Footer
    doc.moveDown(3);
    doc
      .moveTo(54, doc.y)
      .lineTo(558, doc.y)
      .strokeColor("#e6e0d6")
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.6);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#666")
      .text(
        "Bring this receipt and a valid ID when picking up. Must be 21+ to purchase alcohol.",
        { align: "center" },
      );
    doc.moveDown(0.3);
    doc.text("Thank you — see you soon.", { align: "center" });

    doc.end();
  });
}

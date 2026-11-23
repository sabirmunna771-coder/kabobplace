import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPosOrder,
  getAdminProducts,
  getPosOrders,
  updateAdminOrderStatus,
  type ApiOrder,
  type PosOrderPayload,
  type PosSummary,
  type StoreProduct,
} from "@/lib/api";
import { getAudioContextConstructor } from "@/lib/audio-context";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeDollarSign,
  Ban,
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  CreditCard,
  DollarSign,
  Edit,
  Hash,
  Loader2,
  Minus,
  Phone,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  User,
  UtensilsCrossed,
  Wallet,
  X,
} from "lucide-react";

/* ── Design Tokens ─────────────────────────────────────────────── */

const panelClass =
  "relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B3D0B]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl";

const btnPrimary =
  "rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 text-sm placeholder:text-white/30 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-colors";

/* ── Types ─────────────────────────────────────────────────────── */

type OrderType = "DINE_IN" | "WALK_IN" | "TAKEAWAY";
type PayMethod = "CASH" | "CARD" | "MOBILE_WALLET";
type TemplateType = "POS" | "ONLINE" | "DELIVERY" | "GROUP" | "EVENT";

interface CartItem {
  product: StoreProduct;
  quantity: number;
}

interface ReceiptTemplate {
  id: string;
  name: string;
  type: TemplateType;
  html: string;
  description: string;
}

/* ── Component ─────────────────────────────────────────────────── */

export default function PosPage() {
  const { token } = useAuth();
  const { formatPrice, settings } = useSiteSettings();
  const qc = useQueryClient();
  const brandName = (settings.siteName || "Kabob Places").toUpperCase();
  const currencyPrefix = settings.currencySymbol || "CLP $";

  /* ── Sound Effect Function ─────────────────────────────────────── */
  const playBeepSound = useCallback(() => {
    const Ctx = getAudioContextConstructor();
    const audioContext = new Ctx();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // Hz
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, []);

  /* ── Print Receipt Function ────────────────────────────────────── */
  const printReceipt = useCallback((order: ApiOrder) => {
    const printWindow = window.open("", "", "height=400,width=600");
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Receipt #${order.orderNumber}</title>
        <style>
          * { margin: 0; padding: 0; }
          body { font-family: 'Courier New', monospace; background: #f5f5f5; }
          .receipt { background: white; width: 80mm; margin: 20px auto; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 10px; margin-bottom: 10px; }
          .header h1 { font-size: 18px; margin-bottom: 5px; }
          .header p { font-size: 11px; color: #666; }
          .details { font-size: 12px; margin-bottom: 10px; border-bottom: 2px dashed #333; padding-bottom: 10px; }
          .details p { margin: 5px 0; }
          .label { color: #666; }
          .items { margin-bottom: 10px; border-bottom: 2px dashed #333; padding-bottom: 10px; }
          .item { display: flex; justify-content: space-between; font-size: 11px; margin: 5px 0; }
          .total { font-weight: bold; font-size: 14px; margin-top: 10px; text-align: right; }
          .footer { text-align: center; font-size: 10px; color: #666; margin-top: 15px; }
          @media print { 
            body { margin: 0; }
            .receipt { box-shadow: none; margin: 0; width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>${brandName}</h1>
            <p>${settings.siteAddress || "Dirección santa rosa de huara manzana D sitio 29 iquique"}</p>
          </div>
          
          <div class="details">
            <p><span class="label">Order #:</span> ${order.orderNumber}</p>
            <p><span class="label">Type:</span> ${order.orderType?.replace("_", " ") || "N/A"}</p>
            <p><span class="label">Customer:</span> ${order.customerName}</p>
            ${order.tableNumber ? `<p><span class="label">Table:</span> ${order.tableNumber}</p>` : ""}
            <p><span class="label">Payment:</span> ${order.paymentMethod?.replace("_", " ") || "N/A"}</p>
            <p><span class="label">Date:</span> ${new Date(order.createdAt).toLocaleString()}</p>
          </div>
          
          <div class="items">
            ${order.items.map(item => `
              <div class="item">
                <span>${item.quantity}x ${item.productName}</span>
                <span>${formatPrice(item.lineTotal)}</span>
              </div>
            `).join("")}
          </div>
          
          <div class="total">
            <div style="display: flex; justify-content: space-between;">
              <span>TOTAL:</span>
              <span>${formatPrice(order.total)}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>¡Gracias por tu pedido!</p>
            <p>${settings.sitePhone || "+569 9103 0440"}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }, [brandName, formatPrice, settings.siteAddress, settings.sitePhone]);

  /* ── State ───────────────────────────────────────────────────── */
  const [view, setView] = useState<"pos" | "orders" | "templates">("pos");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("WALK_IN");
  const [tableNumber, setTableNumber] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("CASH");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [showReceipt, setShowReceipt] = useState<ApiOrder | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Receipt Templates State
  const [templates, setTemplates] = useState<ReceiptTemplate[]>([
    {
      id: "pos-default",
      name: "POS Order",
      type: "POS",
      description: "Standard receipt template for in-store POS orders",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt #{{ORDER_NUMBER}}</title>
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; background: #f5f5f5; }
    .receipt { background: white; width: 80mm; margin: 20px auto; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 10px; margin-bottom: 10px; }
    .header h1 { font-size: 18px; margin-bottom: 5px; }
    .header p { font-size: 11px; color: #666; }
    .details { font-size: 12px; margin-bottom: 10px; border-bottom: 2px dashed #333; padding-bottom: 10px; }
    .details p { margin: 5px 0; }
    .label { color: #666; }
    .items { margin-bottom: 10px; border-bottom: 2px dashed #333; padding-bottom: 10px; }
    .item { display: flex; justify-content: space-between; font-size: 11px; margin: 5px 0; }
    .total { font-weight: bold; font-size: 14px; margin-top: 10px; text-align: right; }
    .footer { text-align: center; font-size: 10px; color: #666; margin-top: 15px; }
    @media print { body { margin: 0; } .receipt { box-shadow: none; margin: 0; width: 100%; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${brandName}</h1>
      <p>Receipt</p>
    </div>
    
    <div class="details">
      <p><span class="label">Order #:</span> {{ORDER_NUMBER}}</p>
      <p><span class="label">Type:</span> {{ORDER_TYPE}}</p>
      <p><span class="label">Customer:</span> {{CUSTOMER_NAME}}</p>
      {{TABLE_NUMBER}}
      <p><span class="label">Payment:</span> {{PAYMENT_METHOD}}</p>
      <p><span class="label">Date:</span> {{DATE}}</p>
    </div>
    
    <div class="items">
      {{ITEMS}}
    </div>
    
    <div class="total">
      <div style="display: flex; justify-content: space-between;">
        <span>TOTAL:</span>
        <span>${currencyPrefix} {{TOTAL}}</span>
      </div>
    </div>
    
    <div class="footer">
      <p>Thank you for your order!</p>
      <p>Please come again</p>
    </div>
  </div>
</body>
</html>`,
    },
    {
      id: "online-default",
      name: "Online Order",
      type: "ONLINE",
      description: "Receipt template for e-commerce online orders",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Order #{{ORDER_NUMBER}}</title>
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: 'Arial', sans-serif; background: #f9f9f9; }
    .receipt { background: white; max-width: 600px; margin: 30px auto; padding: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 28px; color: #333; margin-bottom: 5px; }
    .header p { font-size: 13px; color: #999; }
    .section { margin-bottom: 25px; }
    .section-title { font-weight: bold; font-size: 13px; color: #333; margin-bottom: 10px; text-transform: uppercase; }
    .info-row { display: flex; justify-content: space-between; font-size: 13px; padding: 8px 0; border-bottom: 1px solid #eee; }
    .label { color: #999; }
    .items { background: #f9f9f9; border-radius: 4px; padding: 15px; }
    .item { display: flex; justify-content: space-between; font-size: 13px; padding: 10px 0; border-bottom: 1px solid #eee; }
    .item:last-child { border-bottom: none; }
    .total-section { font-size: 14px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-amount { font-weight: bold; font-size: 18px; color: #ff6b35; }
    .footer { text-align: center; font-size: 11px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${brandName}</h1>
      <p>Order Confirmation</p>
    </div>
    
    <div class="section">
      <div class="section-title">Order Details</div>
      <div class="info-row">
        <span class="label">Order Number:</span>
        <span>{{ORDER_NUMBER}}</span>
      </div>
      <div class="info-row">
        <span class="label">Date:</span>
        <span>{{DATE}}</span>
      </div>
      <div class="info-row">
        <span class="label">Customer:</span>
        <span>{{CUSTOMER_NAME}}</span>
      </div>
      <div class="info-row">
        <span class="label">Phone:</span>
        <span>{{CUSTOMER_PHONE}}</span>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Items</div>
      <div class="items">
        {{ITEMS}}
      </div>
    </div>
    
    <div class="section total-section">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>${currencyPrefix} {{SUBTOTAL}}</span>
      </div>
      <div class="total-row">
        <span>Tax:</span>
        <span>${currencyPrefix} {{TAX}}</span>
      </div>
      <div class="total-row" style="font-size: 16px; padding-top: 10px; border-top: 1px solid #eee; margin-top: 10px;">
        <span>Total:</span>
        <span class="total-amount">${currencyPrefix} {{TOTAL}}</span>
      </div>
    </div>
    
    <div class="footer">
      <p>Thank you for your order!</p>
      <p>We will notify you when your order is being prepared.</p>
      <p>For support, call us at ${settings.sitePhone || "+569 9103 0440"}</p>
    </div>
  </div>
</body>
</html>`,
    },
    {
      id: "delivery-default",
      name: "Delivery Order",
      type: "DELIVERY",
      description: "Receipt template for delivery orders",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Delivery Order #{{ORDER_NUMBER}}</title>
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #fafafa; }
    .receipt { background: white; width: 90%; max-width: 700px; margin: 25px auto; padding: 25px; border-left: 4px solid #ff6b35; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { margin-bottom: 20px; }
    .header h1 { font-size: 24px; color: #333; }
    .header .subtitle { font-size: 12px; color: #ff6b35; text-transform: uppercase; font-weight: bold; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .box { padding: 15px; background: #f5f5f5; border-radius: 4px; }
    .box-title { font-weight: bold; font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 8px; }
    .box-content { font-size: 13px; color: #333; line-height: 1.6; }
    .items-section { margin: 20px 0; }
    .items-title { font-weight: bold; font-size: 12px; text-transform: uppercase; color: #333; margin-bottom: 10px; }
    .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; }
    .price { font-weight: bold; color: #ff6b35; }
    .summary { margin-top: 20px; padding-top: 15px; border-top: 2px solid #eee; }
    .summary-row { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 0; }
    .summary-total { font-size: 16px; font-weight: bold; color: #ff6b35; display: flex; justify-content: space-between; margin-top: 10px; }
    .status { padding: 15px; background: #e8f5e9; border-radius: 4px; margin-top: 15px; }
    .status-text { color: #2e7d32; font-size: 12px; }
    .footer { text-align: center; font-size: 11px; color: #999; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${brandName}</h1>
      <div class="subtitle">🚗 Delivery Service</div>
    </div>
    
    <div class="grid">
      <div class="box">
        <div class="box-title">Order Info</div>
        <div class="box-content">
          Order #: {{ORDER_NUMBER}}<br>
          Date: {{DATE}}<br>
          Customer: {{CUSTOMER_NAME}}<br>
          Phone: {{CUSTOMER_PHONE}}
        </div>
      </div>
      <div class="box">
        <div class="box-title">Delivery Address</div>
        <div class="box-content">
          {{DELIVERY_ADDRESS}}<br>
          Est. Time: {{DELIVERY_TIME}}
        </div>
      </div>
    </div>
    
    <div class="items-section">
      <div class="items-title">Items</div>
      {{ITEMS}}
    </div>
    
    <div class="summary">
      {{SUMMARY}}
      <div class="summary-total">
        <span>TOTAL:</span>
        <span>${currencyPrefix} {{TOTAL}}</span>
      </div>
    </div>
    
    <div class="status">
      <div class="status-text">✓ Your order has been confirmed and is being prepared. You will receive an update soon.</div>
    </div>
    
    <div class="footer">
      <p>${brandName} · ${settings.siteAddress || "Dirección santa rosa de huara manzana D sitio 29 iquique"}</p>
    </div>
  </div>
</body>
</html>`,
    },
    {
      id: "group-default",
      name: "Group Order",
      type: "GROUP",
      description: "Receipt template for group/bulk orders",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Group Order #{{ORDER_NUMBER}}</title>
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: 'Trebuchet MS', sans-serif; background: #f0f0f0; }
    .receipt { background: white; width: 85%; max-width: 750px; margin: 30px auto; padding: 35px; border-radius: 6px; box-shadow: 0 3px 12px rgba(0,0,0,0.12); }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #ff6b35; padding-bottom: 15px; }
    .header h1 { font-size: 28px; color: #333; }
    .header .badge { display: inline-block; background: #ff6b35; color: white; padding: 5px 12px; border-radius: 4px; font-size: 11px; margin-top: 8px; }
    .info-section { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }
    .info-card { padding: 12px; background: #f9f9f9; border-left: 3px solid #ff6b35; }
    .info-label { font-size: 10px; color: #999; text-transform: uppercase; font-weight: bold; }
    .info-value { font-size: 14px; color: #333; margin-top: 4px; font-weight: bold; }
    .items { margin: 25px 0; }
    .items-title { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 15px; }
    .item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee; }
    .item-name { flex: 1; font-size: 13px; }
    .item-qty { width: 60px; text-align: center; font-size: 12px; color: #666; }
    .item-price { width: 80px; text-align: right; font-weight: bold; color: #ff6b35; }
    .totals { margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
    .total-final { display: flex; justify-content: space-between; padding: 12px 0; font-size: 16px; font-weight: bold; color: #ff6b35; }
    .notes { background: #f0f7ff; padding: 12px; border-radius: 4px; margin-top: 15px; font-size: 11px; color: #0066cc; }
    .footer { text-align: center; font-size: 11px; color: #999; margin-top: 25px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${brandName} GROUP ORDER</h1>
      <div class="badge">GROUP {{GROUP_SIZE}} PERSONS</div>
    </div>
    
    <div class="info-section">
      <div class="info-card">
        <div class="info-label">Order Number</div>
        <div class="info-value">{{ORDER_NUMBER}}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Date & Time</div>
        <div class="info-value">{{DATE}}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Contact</div>
        <div class="info-value">{{CUSTOMER_PHONE}}</div>
      </div>
    </div>
    
    <div class="items">
      <div class="items-title">Order Items</div>
      {{ITEMS}}
    </div>
    
    <div class="totals">
      {{SUMMARY}}
      <div class="total-final">
        <span>GROUP TOTAL:</span>
        <span>${currencyPrefix} {{TOTAL}}</span>
      </div>
    </div>
    
    <div class="notes">
      Special instructions: {{NOTES}}
    </div>
    
    <div class="footer">
      <p>Thank you for choosing ${brandName}!</p>
      <p>Enjoy your meal together!</p>
    </div>
  </div>
</body>
</html>`,
    },
    {
      id: "event-default",
      name: "Event Order",
      type: "EVENT",
      description: "Receipt template for catering and event orders",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Event Order #{{ORDER_NUMBER}}</title>
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: 'Georgia', serif; background: linear-gradient(135deg, #f5f5f5, #efefef); }
    .receipt { background: white; width: 90%; max-width: 800px; margin: 40px auto; padding: 40px; border-top: 5px solid #ff6b35; border-bottom: 5px solid #ff6b35; box-shadow: 0 5px 20px rgba(0,0,0,0.15); }
    .header { text-align: center; margin-bottom: 35px; }
    .header h1 { font-size: 32px; color: #333; font-weight: normal; letter-spacing: 2px; }
    .header .subtitle { font-size: 13px; color: #999; margin-top: 5px; font-style: italic; }
    .event-banner { background: linear-gradient(135deg, #ff6b35, #ff8c42); color: white; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: center; }
    .event-banner h2 { font-size: 18px; margin-bottom: 10px; }
    .event-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .detail-box { padding: 15px; background: #f9f9f9; border: 1px solid #eee; }
    .detail-label { font-size: 11px; color: #999; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; }
    .detail-value { font-size: 14px; color: #333; }
    .items-section { margin: 25px 0; }
    .section-title { font-size: 13px; font-weight: bold; color: #333; text-transform: uppercase; margin-bottom: 15px; border-bottom: 2px solid #ff6b35; padding-bottom: 8px; }
    .item { display: flex; justify-content: space-between; padding: 10px 0; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
    .calculation { background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .calc-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .total-amount { font-size: 18px; font-weight: bold; color: #ff6b35; }
    .payment-terms { background: #fff3e0; padding: 12px; border-left: 3px solid #ff6b35; margin-top: 15px; font-size: 11px; }
    .footer { text-align: center; font-size: 11px; color: #999; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${brandName} CATERING</h1>
      <div class="subtitle">Premium Event & Catering Services</div>
    </div>
    
    <div class="event-banner">
      <h2>✨ SPECIAL EVENT ORDER ✨</h2>
      <p>Thank you for choosing us for your special occasion!</p>
    </div>
    
    <div class="event-details">
      <div class="detail-box">
        <div class="detail-label">Order Reference</div>
        <div class="detail-value">{{ORDER_NUMBER}}</div>
      </div>
      <div class="detail-box">
        <div class="detail-label">Event Date</div>
        <div class="detail-value">{{EVENT_DATE}}</div>
      </div>
      <div class="detail-box">
        <div class="detail-label">Event Organizer</div>
        <div class="detail-value">{{CUSTOMER_NAME}}</div>
      </div>
      <div class="detail-box">
        <div class="detail-label">Contact</div>
        <div class="detail-value">{{CUSTOMER_PHONE}}</div>
      </div>
      <div class="detail-box">
        <div class="detail-label">Guest Count</div>
        <div class="detail-value">{{GUEST_COUNT}} guests</div>
      </div>
      <div class="detail-box">
        <div class="detail-label">Venue</div>
        <div class="detail-value">{{VENUE}}</div>
      </div>
    </div>
    
    <div class="items-section">
      <div class="section-title">Menu & Catering Items</div>
      {{ITEMS}}
    </div>
    
    <div class="calculation">
      {{SUMMARY}}
      <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 16px;">
        <span style="font-weight: bold;">TOTAL INVOICE:</span>
        <span class="total-amount">${currencyPrefix} {{TOTAL}}</span>
      </div>
    </div>
    
    <div class="payment-terms">
      <strong>Payment & Delivery Terms:</strong><br>
      • 50% advance payment required to confirm booking<br>
      • Balance payment due 24 hours before event<br>
      • Free delivery within 20km radius
    </div>
    
    <div class="footer">
      <p>For any queries or changes, please contact us immediately.</p>
      <p>We look forward to making your event memorable!</p>
    </div>
  </div>
</body>
</html>`,
    },
  ]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("pos-default");
  const [editingTemplate, setEditingTemplate] = useState<ReceiptTemplate | null>(null);
  const [testOrder, setTestOrder] = useState<Partial<ApiOrder> | null>(null);

  /* ── Queries ─────────────────────────────────────────────────── */
  const productsQuery = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => getAdminProducts(token!),
    enabled: !!token,
  });

  const posOrdersQuery = useQuery({
    queryKey: ["admin", "pos-orders"],
    queryFn: () => getPosOrders(token!),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: PosOrderPayload) => createPosOrder(token!, payload),
    onSuccess: (data) => {
      toast.success("Order placed successfully!");
      setShowReceipt(data.order);
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin", "pos-orders"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ApiOrder["status"] }) =>
      updateAdminOrderStatus(token!, id, status),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin", "pos-orders"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  /* ── Derived ─────────────────────────────────────────────────── */
  const products = productsQuery.data ?? [];
  const categories = useMemo(() => {
    const cats = new Map<string, string>();
    products.forEach((p) => {
      if (p.categoryLabel && !cats.has(p.categoryLabel)) {
        cats.set(p.categoryLabel, p.categoryLabel);
      }
    });
    return Array.from(cats.keys());
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.isActive && p.isInStock);
    if (selectedCategory) {
      list = list.filter((p) => p.categoryLabel === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, selectedCategory, search]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, ci) => sum + ci.product.price * ci.quantity, 0),
    [cart],
  );

  const posOrders = posOrdersQuery.data?.orders ?? [];
  const summary: PosSummary = posOrdersQuery.data?.summary ?? {
    totalOrders: 0,
    totalRevenue: 0,
    dineIn: 0,
    walkIn: 0,
    takeaway: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  };

  /* ── Handlers ────────────────────────────────────────────────── */
  const addToCart = useCallback((product: StoreProduct) => {
    playBeepSound();
    setCart((prev) => {
      const idx = prev.findIndex((ci) => ci.product.dbId === product.dbId);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, [playBeepSound]);

  const updateQty = useCallback((dbId: number, delta: number) => {
    setCart((prev) => {
      const next = prev.map((ci) =>
        ci.product.dbId === dbId
          ? { ...ci, quantity: Math.max(0, ci.quantity + delta) }
          : ci,
      ).filter((ci) => ci.quantity > 0);
      return next;
    });
  }, []);

  const removeFromCart = useCallback((dbId: number) => {
    setCart((prev) => prev.filter((ci) => ci.product.dbId !== dbId));
  }, []);

  const resetForm = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setNotes("");
    setTableNumber("");
  };

  // Template Handlers
  const updateTemplate = (templateId: string, updates: Partial<ReceiptTemplate>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, ...updates } : t))
    );
    toast.success("Template updated");
  };

  const saveTemplateEdit = () => {
    if (!editingTemplate) return;
    updateTemplate(editingTemplate.id, editingTemplate);
    setEditingTemplate(null);
  };

  const duplicateTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    const newTemplate: ReceiptTemplate = {
      ...template,
      id: `${templateId}-copy-${Date.now()}`,
      name: `${template.name} (Copy)`,
    };
    setTemplates((prev) => [...prev, newTemplate]);
    toast.success("Template duplicated");
  };

  const resetTemplateToDefault = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    const defaultTemplates = [
      templates.find((t) => t.id === "pos-default"),
      templates.find((t) => t.id === "online-default"),
      templates.find((t) => t.id === "delivery-default"),
      templates.find((t) => t.id === "group-default"),
      templates.find((t) => t.id === "event-default"),
    ].filter(Boolean) as ReceiptTemplate[];
    const defaultTemplate = defaultTemplates.find((t) => t.type === template.type);
    if (defaultTemplate) {
      updateTemplate(templateId, { html: defaultTemplate.html });
    }
  };

  const renderPreview = (template: ReceiptTemplate, testData?: Partial<ApiOrder>) => {
    if (!testData) {
      testData = {
        orderNumber: "#123456",
        customerName: "Camila Rojas",
        customerPhone: "+569 9103 0440",
        orderType: "POS",
        paymentMethod: "CASH",
        tableNumber: "T-01",
        createdAt: new Date().toISOString(),
        items: [
          { id: 1, productPrice: 4500, quantity: 2, productName: "Chicken Kabob", lineTotal: 9000 },
          { id: 2, productPrice: 2500, quantity: 1, productName: "Iced Tea", lineTotal: 2500 },
        ],
        total: 11500,
      };
    }

    let html = template.html;
    const itemsHtml = (testData.items || [])
      .map(
        (item) =>
          `<div class="item"><span>${item.quantity}x ${item.productName}</span><span>${formatPrice(item.lineTotal)}</span></div>`,
      )
      .join("");

    const summaryHtml = testData.items
      ? `<div class="summary-row"><span>Subtotal:</span><span>${formatPrice(Math.max(0, (testData.total || 0) - 500))}</span></div>
         <div class="summary-row"><span>Tax/Fee:</span><span>${formatPrice(500)}</span></div>`
      : "";

    html = html
      .replace("{{ORDER_NUMBER}}", testData.orderNumber || "#000000")
      .replace("{{ORDER_TYPE}}", (testData.orderType || "").replace("_", " "))
      .replace("{{CUSTOMER_NAME}}", testData.customerName || "Test Customer")
      .replace("{{CUSTOMER_PHONE}}", testData.customerPhone || "+569 9103 0440")
      .replace("{{DATE}}", new Date(testData.createdAt || Date.now()).toLocaleString())
      .replace("{{PAYMENT_METHOD}}", (testData.paymentMethod || "").replace("_", " "))
      .replace("{{TABLE_NUMBER}}", testData.tableNumber ? `<p><span class="label">Table:</span> ${testData.tableNumber}</p>` : "")
      .replace("{{ITEMS}}", itemsHtml)
      .replace("{{SUMMARY}}", summaryHtml)
      .replace("{{SUBTOTAL}}", testData.total ? Math.max(0, testData.total - 500).toString() : "0")
      .replace("{{TAX}}", "500")
      .replace("{{TOTAL}}", testData.total?.toFixed(0) || "0")
      .replace("{{GROUP_SIZE}}", "10")
      .replace("{{DELIVERY_ADDRESS}}", settings.siteAddress || "Dirección santa rosa de huara manzana D sitio 29 iquique")
      .replace("{{DELIVERY_TIME}}", "30-45 mins")
      .replace("{{EVENT_DATE}}", "May 20, 2024")
      .replace("{{GUEST_COUNT}}", "50")
      .replace("{{VENUE}}", "Sample Venue")
      .replace("{{NOTES}}", "Special instructions here");

    return html;
  };

  const handlePlaceOrder = () => {
    if (!cart.length) return toast.error("Cart is empty");
    const name = customerName.trim() || "Walk-in Customer";
    const phone = customerPhone.trim() || (settings.sitePhone || "+569 9103 0440");
    const table = orderType === "DINE_IN" ? (tableNumber.trim() || "Table 1") : undefined;

    createMutation.mutate({
      customerName: name,
      customerPhone: phone,
      orderType,
      tableNumber: table,
      paymentMethod: payMethod,
      notes: notes.trim() || undefined,
      items: cart.map((ci) => ({
        publicId: ci.product.id,
        quantity: ci.quantity,
      })),
    });
  };

  /* ── Loading ─────────────────────────────────────────────────── */
  if (productsQuery.isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  /* ── Receipt Modal ───────────────────────────────────────────── */
  if (showReceipt) {
    return (
      <div className="space-y-5">
        <div className={cn(panelClass, "mx-auto max-w-lg p-8 text-center")}>
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/30">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold">Order Placed!</h2>
          <p className="mt-1 text-sm text-white/50">#{showReceipt.orderNumber}</p>

          <div className="mt-6 space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Customer</span>
              <span>{showReceipt.customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Phone</span>
              <span>{showReceipt.customerPhone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Type</span>
              <span className="capitalize">{showReceipt.orderType?.replace("_", " ").toLowerCase()}</span>
            </div>
            {showReceipt.tableNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Table</span>
                <span>{showReceipt.tableNumber}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Payment</span>
              <span className="capitalize">{showReceipt.paymentMethod?.replace("_", " ").toLowerCase()}</span>
            </div>

            <div className="my-3 border-t border-white/10" />

            {showReceipt.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}× {item.productName}
                </span>
                <span>{formatPrice(item.lineTotal)}</span>
              </div>
            ))}

            <div className="my-3 border-t border-white/10" />

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatPrice(showReceipt.total)}</span>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => printReceipt(showReceipt)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30"
            >
              <Printer size={16} />
              Print Receipt
            </button>
            <button
              onClick={() => setShowReceipt(null)}
              className={cn(btnPrimary, "flex-1")}
            >
              New Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Receipt Templates View ──────────────────────────────────── */
  if (view === "templates") {
    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className={cn(panelClass, "p-5")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setView("pos")} className="rounded-lg p-2 hover:bg-white/10 transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-bold">Receipt Templates</h2>
                <p className="text-sm text-white/50">Manage and customize receipt templates for different order types</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Left: Template List */}
          <div className={cn(panelClass, "p-4 max-h-[calc(100vh-200px)] overflow-y-auto")}>
            <h3 className="text-lg font-bold mb-4">Templates</h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  role="button"
                  tabIndex={0}
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setEditingTemplate(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedTemplateId(template.id);
                      setEditingTemplate(null);
                    }
                  }}
                  className={cn(
                    "w-full text-left p-4 rounded-lg transition-all border border-white/10 cursor-pointer select-none",
                    selectedTemplateId === template.id
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : "bg-white/5 hover:bg-white/10 border-white/5",
                  )}
                >
                  <p className="font-semibold text-sm">{template.name}</p>
                  <p className="text-[11px] text-white/50 mt-1">{template.description}</p>
                  <div className="mt-2 inline-block px-2 py-1 bg-white/5 rounded text-[10px] text-white/60">
                    {template.type}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle: Editor */}
          <div className="col-span-2 space-y-4">
            {selectedTemplate && (
              <>
                {/* Editor Header */}
                <div className={cn(panelClass, "p-4")}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold">{editingTemplate?.name || selectedTemplate.name}</h3>
                      <p className="text-sm text-white/50">Type: {selectedTemplate.type}</p>
                    </div>
                    <div className="flex gap-2">
                      {editingTemplate ? (
                        <>
                          <button
                            onClick={() => setEditingTemplate(null)}
                            className="rounded-lg px-3 py-2 bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveTemplateEdit}
                            className="rounded-lg px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-sm font-medium text-white shadow-lg hover:shadow-lg transition-all"
                          >
                            Save Changes
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingTemplate({ ...selectedTemplate })}
                            className="rounded-lg px-3 py-2 bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => duplicateTemplate(selectedTemplate.id)}
                            className="rounded-lg px-3 py-2 bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors"
                          >
                            Duplicate
                          </button>
                          {selectedTemplate.id.includes("default") && (
                            <button
                              onClick={() => resetTemplateToDefault(selectedTemplate.id)}
                              className="rounded-lg px-3 py-2 bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors text-red-400"
                            >
                              Reset to Default
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Template Variables Info */}
                  <div className="bg-black/20 rounded-lg p-3 text-[11px] text-white/60">
                    <p className="font-semibold mb-2">Available Variables:</p>
                    <div className="grid grid-cols-2 gap-1">
                      <span>• {'{{ORDER_NUMBER}}'} - Order #</span>
                      <span>• {'{{ORDER_TYPE}}'} - Order Type</span>
                      <span>• {'{{CUSTOMER_NAME}}'} - Customer</span>
                      <span>• {'{{CUSTOMER_PHONE}}'} - Phone</span>
                      <span>• {'{{DATE}}'} - Order Date</span>
                      <span>• {'{{ITEMS}}'} - Item List</span>
                      <span>• {'{{TOTAL}}'} - Total Amount</span>
                      <span>• {'{{PAYMENT_METHOD}}'} - Payment</span>
                    </div>
                  </div>
                </div>

                {/* Editor */}
                {editingTemplate ? (
                  <div className={cn(panelClass, "p-4")}>
                    <label className="block text-sm font-semibold mb-2">Template HTML</label>
                    <textarea
                      value={editingTemplate.html}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, html: e.target.value })}
                      className="w-full h-[400px] rounded-lg border border-white/15 bg-black/20 p-3 font-mono text-xs text-white placeholder:text-white/30 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-none"
                      placeholder="Paste HTML template here..."
                    />
                  </div>
                ) : (
                  <>
                    {/* Preview Iframe */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className={cn(panelClass, "p-4")}>
                        <h4 className="text-sm font-semibold mb-3">Preview</h4>
                        <iframe
                          srcDoc={renderPreview(selectedTemplate, testOrder as Partial<ApiOrder>)}
                          className="w-full h-[400px] rounded-lg bg-white border border-white/10"
                          title="Receipt Preview"
                        />
                      </div>

                      {/* Test Data Editor */}
                      <div className={cn(panelClass, "p-4 overflow-y-auto")}>
                        <h4 className="text-sm font-semibold mb-3">Test Data</h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <label className="text-[11px] text-white/50 mb-1 block">Order Number</label>
                            <input
                              type="text"
                              value={testOrder?.orderNumber || ""}
                              onChange={(e) => setTestOrder({ ...testOrder, orderNumber: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-white/50 mb-1 block">Customer Name</label>
                            <input
                              type="text"
                              value={testOrder?.customerName || ""}
                              onChange={(e) => setTestOrder({ ...testOrder, customerName: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-white/50 mb-1 block">Phone</label>
                            <input
                              type="text"
                              value={testOrder?.customerPhone || ""}
                              onChange={(e) => setTestOrder({ ...testOrder, customerPhone: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-white/50 mb-1 block">Total Amount</label>
                            <input
                              type="number"
                              value={testOrder?.total || 0}
                              onChange={(e) => setTestOrder({ ...testOrder, total: Number(e.target.value) })}
                              className={inputClass}
                            />
                          </div>
                          <button
                            onClick={() => {
                              const w = window.open("", "receipt-print", "width=600,height=600");
                              if (w) {
                                w.document.write(renderPreview(selectedTemplate, testOrder as Partial<ApiOrder>));
                                w.document.close();
                                w.print();
                              }
                            }}
                            className={cn(btnPrimary, "w-full flex items-center justify-center gap-2 py-2 mt-4")}
                          >
                            <Printer size={14} />
                            Print Test Receipt
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Orders View ─────────────────────────────────────────────── */
  if (view === "orders") {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className={cn(panelClass, "p-5")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setView("pos")} className="rounded-lg p-2 hover:bg-white/10 transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-bold">Today's POS Orders</h2>
                <p className="text-sm text-white/50">{posOrders.length} orders today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Revenue", value: formatPrice(summary.totalRevenue), color: "from-primary/20 to-accent/20", icon: DollarSign },
            { label: "Dine-In", value: summary.dineIn.toString(), color: "from-blue-500/20 to-cyan-500/20", icon: UtensilsCrossed },
            { label: "Walk-In", value: summary.walkIn.toString(), color: "from-emerald-500/20 to-green-500/20", icon: User },
            { label: "Takeaway", value: summary.takeaway.toString(), color: "from-purple-500/20 to-pink-500/20", icon: ShoppingCart },
          ].map((s) => (
            <div key={s.label} className={cn(panelClass, "p-4")}>
              <div className={cn("mb-2 flex size-9 items-center justify-center rounded-lg bg-gradient-to-br", s.color)}>
                <s.icon size={18} className="text-white/80" />
              </div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-white/50">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Order List */}
        <div className={cn(panelClass, "divide-y divide-white/5 overflow-hidden")}>
          {posOrders.length === 0 ? (
            <div className="p-10 text-center text-white/40">
              <Receipt size={40} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium">No POS orders today</p>
            </div>
          ) : (
            posOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{order.customerName}</span>
                    <OrderTypeBadge type={order.orderType} />
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-white/40">
                    <span>#{order.orderNumber.slice(-8)}</span>
                    {order.tableNumber && <span>Table {order.tableNumber}</span>}
                    <span>{order.items.length} items</span>
                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{formatPrice(order.total)}</p>
                  <p className="text-xs text-white/30 capitalize">{order.paymentMethod?.replace("_", " ").toLowerCase()}</p>
                </div>
                <div className="flex gap-1">
                  {order.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => statusMutation.mutate({ id: order.id, status: "CONFIRMED" })}
                        className="rounded-lg p-2 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        title="Confirm"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => statusMutation.mutate({ id: order.id, status: "CANCELLED" })}
                        className="rounded-lg p-2 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Cancel"
                      >
                        <Ban size={16} />
                      </button>
                    </>
                  )}
                  {order.status === "CONFIRMED" && (
                    <button
                      onClick={() => statusMutation.mutate({ id: order.id, status: "PREPARING" })}
                      className="rounded-lg p-2 text-amber-400 hover:bg-amber-500/20 transition-colors"
                      title="Start Preparing"
                    >
                      <ChefHat size={16} />
                    </button>
                  )}
                  {order.status === "PREPARING" && (
                    <button
                      onClick={() => statusMutation.mutate({ id: order.id, status: "COMPLETED" })}
                      className="rounded-lg p-2 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title="Mark Completed"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  /* ── POS Main View ───────────────────────────────────────────── */
  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] lg:overflow-hidden p-2 sm:p-4">
      {/* Left — Product Grid */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <div className={cn(panelClass, "mb-4 p-4")}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className={cn(inputClass, "pl-9")}
              />
            </div>
            <button
              onClick={() => setView("orders")}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              <Receipt size={16} />
              <span>Orders</span>
              {summary.pending > 0 && (
                <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {summary.pending}
                </span>
              )}
            </button>
            
            <button
              onClick={() => window.open("/admin/pos-fullscreen", "pos-fullscreen", "width=1920,height=1080")}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
              title="Open in fullscreen mode"
            >
              <Smartphone size={16} />
              <span>Fullscreen</span>
            </button>

            <button
              onClick={() => setView("templates")}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
              title="Manage receipt templates"
            >
              <Edit size={16} />
              <span>Templates</span>
            </button>
          </div>

          {/* Category Pills */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                !selectedCategory
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-white/5 text-white/60 hover:bg-white/10",
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-white/5 text-white/60 hover:bg-white/10",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className={cn(panelClass, "flex items-center justify-center p-10")}>
              <p className="text-white/40">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => {
                  const inCart = cart.find((ci) => ci.product.dbId === product.dbId);
                return (
                  <div
                    role="button"
                    tabIndex={0}
                    key={product.id}
                    onClick={() => addToCart(product)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); addToCart(product); } }}
                    className={cn(
                      panelClass,
                      "group relative flex flex-col p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 cursor-pointer select-none",
                      inCart && "ring-1 ring-primary/40 border-primary/30",
                    )}
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="mb-2 aspect-square w-full rounded-xl object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="mb-2 flex aspect-square w-full items-center justify-center rounded-xl bg-white/5">
                        <UtensilsCrossed size={32} className="text-white/20" />
                      </div>
                    )}
                    <p className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</p>
                    <p className="mt-auto pt-1 font-bold text-primary">{formatPrice(product.price)}</p>
                    {inCart && (
                      <div className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-lg">
                        {inCart.quantity}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right — Cart & Checkout */}
      <div className={cn(panelClass, "flex w-full lg:w-[380px] shrink-0 flex-col p-0")}>
        {/* Cart Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary" />
            <h3 className="font-bold">Cart</h3>
            {cart.length > 0 && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                {cart.reduce((s, c) => s + c.quantity, 0)}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-white/30">
              <ShoppingCart size={40} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="text-xs">Tap products to add</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5 px-4">
              {cart.map((ci) => (
                <div key={ci.product.dbId} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{ci.product.name}</p>
                    <p className="text-xs text-white/40">{formatPrice(ci.product.price)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(ci.product.dbId, -1)}
                      className="flex size-7 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{ci.quantity}</span>
                    <button
                      onClick={() => updateQty(ci.product.dbId, 1)}
                      className="flex size-7 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <p className="w-20 text-right text-sm font-bold text-primary">
                    {formatPrice(ci.product.price * ci.quantity)}
                  </p>
                  <button
                    onClick={() => removeFromCart(ci.product.dbId)}
                    className="text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Section */}
        <div className="border-t border-white/10 p-4 space-y-3">
          {/* Order Type */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/40">Order Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { value: "DINE_IN" as OrderType, label: "Dine-In", icon: UtensilsCrossed },
                { value: "WALK_IN" as OrderType, label: "Walk-In", icon: User },
                { value: "TAKEAWAY" as OrderType, label: "Takeaway", icon: ShoppingCart },
              ] as const).map((t) => (
                <button
                  key={t.value}
                  onClick={() => setOrderType(t.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg p-2 text-[11px] font-semibold transition-all",
                    orderType === t.value
                      ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                      : "bg-white/5 text-white/50 hover:bg-white/10",
                  )}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table Number (Dine-In) */}
          {orderType === "DINE_IN" && (
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/40">Table Number</label>
              <div className="relative">
                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. T-01"
                  className={cn(inputClass, "pl-8 py-2")}
                />
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer"
                  className={cn(inputClass, "pl-8 py-2")}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">Phone</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+569 9103 0440"
                  className={cn(inputClass, "pl-8 py-2")}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/40">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions..."
              className={cn(inputClass, "py-2")}
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-white/40">Payment</label>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { value: "CASH" as PayMethod, label: "Cash", icon: Wallet },
                { value: "CARD" as PayMethod, label: "Card", icon: CreditCard },
                { value: "MOBILE_WALLET" as PayMethod, label: "Mobile", icon: Smartphone },
              ] as const).map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPayMethod(p.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg p-2 text-[11px] font-semibold transition-all",
                    payMethod === p.value
                      ? "bg-gradient-to-br from-emerald-500/20 to-green-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                      : "bg-white/5 text-white/50 hover:bg-white/10",
                  )}
                >
                  <p.icon size={14} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Total & Place Order */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs text-white/40">Total</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(cartTotal)}</p>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={!cart.length || createMutation.isPending}
              className={cn(btnPrimary, "flex items-center gap-2 px-6 py-3")}
            >
              {createMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <BadgeDollarSign size={16} />
              )}
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helper Components ─────────────────────────────────────────── */

function OrderTypeBadge({ type }: { type?: string }) {
  const config: Record<string, { label: string; className: string }> = {
    DINE_IN: { label: "Dine-In", className: "bg-blue-500/15 text-blue-400" },
    WALK_IN: { label: "Walk-In", className: "bg-emerald-500/15 text-emerald-400" },
    TAKEAWAY: { label: "Takeaway", className: "bg-purple-500/15 text-purple-400" },
  };
  const c = config[type ?? ""] ?? { label: type ?? "—", className: "bg-white/10 text-white/50" };
  return <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", c.className)}>{c.label}</span>;
}

function OrderStatusBadge({ status }: { status: ApiOrder["status"] }) {
  const config: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "bg-amber-500/15 text-amber-400" },
    CONFIRMED: { label: "Confirmed", className: "bg-blue-500/15 text-blue-400" },
    PREPARING: { label: "Preparing", className: "bg-primary/15 text-primary" },
    OUT_FOR_DELIVERY: { label: "Out", className: "bg-cyan-500/15 text-cyan-400" },
    COMPLETED: { label: "Done", className: "bg-emerald-500/15 text-emerald-400" },
    CANCELLED: { label: "Cancelled", className: "bg-red-500/15 text-red-400" },
  };
  const c = config[status] ?? { label: status, className: "bg-white/10 text-white/50" };
  return <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", c.className)}>{c.label}</span>;
}

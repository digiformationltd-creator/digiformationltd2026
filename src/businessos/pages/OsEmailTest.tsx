import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle2, XCircle } from "lucide-react";

const TEMPLATES = [
  { value: "email-system-check", label: "System Check (safest)" },
  { value: "welcome", label: "Welcome" },
  { value: "order-confirmation", label: "Order Confirmation" },
  { value: "invoice-issued", label: "Invoice Issued" },
  { value: "ticket-received", label: "Ticket Received" },
];

export default function OsEmailTest() {
  const [email, setEmail] = useState("");
  const [template, setTemplate] = useState("email-system-check");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; message: string }>(null);

  const sendTest = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: template,
          recipientEmail: email,
          idempotencyKey: `test-${template}-${Date.now()}`,
          templateData: {
            name: "Test User",
            siteName: "DigiFormation",
            orderNumber: "TEST-0001",
            invoiceNumber: "INV-TEST-0001",
            amount: "£100.00",
            ticketId: "TKT-TEST-0001",
          },
        },
      });
      if (error) throw error;
      setResult({ ok: true, message: `Queued successfully. Check ${email} inbox in ~10s.` });
      toast.success("Test email queued");
    } catch (e: any) {
      const msg = e?.message || String(e);
      setResult({ ok: false, message: msg });
      toast.error("Failed: " + msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Email System Test
          </CardTitle>
          <CardDescription>
            Send a test transactional email through the queue to verify domain & delivery.
            Sender: <code className="text-xs">support.digiformation.uk</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <select
              id="template"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              disabled={sending}
            >
              {TEMPLATES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <Button onClick={sendTest} disabled={sending} className="w-full">
            {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</> : <><Mail className="h-4 w-4 mr-2" /> Send Test Email</>}
          </Button>
          {result && (
            <div className={`flex items-start gap-2 rounded-md p-3 text-sm ${result.ok ? "bg-green-50 text-green-900 border border-green-200" : "bg-red-50 text-red-900 border border-red-200"}`}>
              {result.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <XCircle className="h-4 w-4 mt-0.5" />}
              <span className="break-words">{result.message}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground pt-2">
            Tip: If delivery fails with “no_matching_sender”, the sender domain DNS is still verifying.
            Check <strong>Cloud → Emails → Manage Domains</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { z } from "zod";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email").max(255, "Email too long"),
  message: z.string().trim().max(2000, "Message too long").optional(),
});

const NewsletterForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, message: message || undefined });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message ?? null,
      });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("You're already subscribed!");
      } else {
        toast.error("Subscription failed. Please try again.");
      }
      return;
    }
    toast.success("Subscribed! Thanks for joining our newsletter.");
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="text-xs uppercase tracking-[0.18em] font-semibold opacity-90">
        Newsletter
      </div>
      <p className="text-sm text-white/80">
        Get UK & USA business tips and offers in your inbox.
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        maxLength={100}
        required
        className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        maxLength={255}
        required
        className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Your query or message (optional)"
        maxLength={2000}
        rows={3}
        className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-60 text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Subscribing...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Subscribe
          </>
        )}
      </button>
    </form>
  );
};

export default NewsletterForm;

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { X } from "lucide-react";
import { trackConversion } from "@/lib/gtag";

const leadCaptureSchema = z.object({
  email: z.string().trim().email({ message: "Email tidak valid" }).max(255, { message: "Email terlalu panjang" }),
  whatsapp: z.string().trim().optional(),
});

const LeadCapturePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ email: "", whatsapp: "" });
  const [errors, setErrors] = useState<{ email?: string; whatsapp?: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    // Show popup after 15 seconds
    const timer = setTimeout(() => {
      const hasSeenPopup = localStorage.getItem("storo-lead-capture-seen");
      if (!hasSeenPopup) {
        setIsOpen(true);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = leadCaptureSchema.parse(formData);
      
      // Save lead to database via edge function
      const response = await fetch('https://unpqekghcpjclzvpeyse.supabase.co/functions/v1/leads-collector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: validatedData.email,
          whatsapp: validatedData.whatsapp || null,
          domain: window.location.hostname,
          project: 'storo-id',
          source: 'popup'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save lead');
      }
      
      // Mark as seen
      localStorage.setItem("storo-lead-capture-seen", "true");
      
      // Create WhatsApp message
      const message = `Halo Storo.id! Saya tertarik untuk membuat webstore.%0A%0AEmail: ${encodeURIComponent(validatedData.email)}${validatedData.whatsapp ? `%0AWhatsApp: ${encodeURIComponent(validatedData.whatsapp)}` : ''}`;
      
      // Open WhatsApp
      window.open(`https://wa.me/6285157406969?text=${message}`, '_blank');
      
      // Track Google Ads conversion
      trackConversion();
      
      toast({
        title: "Terima kasih!",
        description: "Data Anda tersimpan dan kami akan segera menghubungi Anda via WhatsApp.",
      });
      
      setIsOpen(false);
      setFormData({ email: "", whatsapp: "" });
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { email?: string; whatsapp?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') newErrors.email = err.message;
          if (err.path[0] === 'whatsapp') newErrors.whatsapp = err.message;
        });
        setErrors(newErrors);
      } else {
        console.error('Error saving lead:', error);
        // Still show WhatsApp on error
        const validatedData = leadCaptureSchema.parse(formData);
        localStorage.setItem("storo-lead-capture-seen", "true");
        
        const message = `Halo Storo.id! Saya tertarik untuk membuat webstore.%0A%0AEmail: ${encodeURIComponent(validatedData.email)}${validatedData.whatsapp ? `%0AWhatsApp: ${encodeURIComponent(validatedData.whatsapp)}` : ''}`;
        window.open(`https://wa.me/6285157406969?text=${message}`, '_blank');
        
        // Track Google Ads conversion
        trackConversion();
        
        toast({
          title: "Terima kasih!",
          description: "Kami akan segera menghubungi Anda via WhatsApp.",
        });
        
        setIsOpen(false);
        setFormData({ email: "", whatsapp: "" });
        setErrors({});
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("storo-lead-capture-seen", "true");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20">
        <button 
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Bikin Website Toko Online dalam Hitungan Menit
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Cukup 1 klik, produk Shopee kamu otomatis pindah ke website. Nggak perlu coding, nggak perlu ribet.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@example.com"
              className={errors.email ? "border-destructive" : ""}
              required
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp (Opsional)</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="08123456789"
              className={errors.whatsapp ? "border-destructive" : ""}
            />
            {errors.whatsapp && <p className="text-sm text-destructive">{errors.whatsapp}</p>}
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Mulai Sekarang
          </Button>
        </form>
        
        <p className="text-xs text-muted-foreground text-center mt-4">
          Dengan melanjutkan, Anda setuju dengan syarat dan ketentuan kami.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default LeadCapturePopup;
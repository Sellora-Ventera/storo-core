"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Store, TrendingUp, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { X } from "lucide-react";
import { trackConversion } from "@/lib/gtag";

const exitIntentSchema = z.object({
  email: z.string().trim().email({ message: "Email tidak valid" }).max(255, { message: "Email terlalu panjang" }),
  whatsapp: z.string().trim().optional(),
});

const ExitIntentPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ email: "", whatsapp: "" });
  const [errors, setErrors] = useState<{ email?: string; whatsapp?: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    let mouseLeaveCount = 0;
    
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse leaves through the top of the page
      if (e.clientY <= 0) {
        mouseLeaveCount++;
        const hasSeenExitIntent = localStorage.getItem("storo-exit-intent-seen");
        const hasSeenLeadCapture = localStorage.getItem("storo-lead-capture-seen");
        
        // Show exit intent if user hasn't seen it and hasn't seen lead capture recently
        if (!hasSeenExitIntent && mouseLeaveCount === 1) {
          setIsOpen(true);
        }
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = exitIntentSchema.parse(formData);
      
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
          source: 'exit-intent'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save lead');
      }
      
      // Mark as seen
      localStorage.setItem("storo-exit-intent-seen", "true");
      
      // Create WhatsApp message
      const message = `Halo Storo.id! Saya tertarik untuk membuat webstore mandiri.%0A%0AEmail: ${encodeURIComponent(validatedData.email)}${validatedData.whatsapp ? `%0AWhatsApp: ${encodeURIComponent(validatedData.whatsapp)}` : ''}`;
      
      // Open WhatsApp
      window.open(`https://wa.me/6285148416700?text=${message}`, '_blank');
      
      // Track Google Ads conversion
      trackConversion();
      
      toast({
        title: "Pilihan yang tepat!",
        description: "Data Anda tersimpan dan tim kami akan segera menghubungi Anda untuk membantu membuat webstore mandiri.",
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
        const validatedData = exitIntentSchema.parse(formData);
        localStorage.setItem("storo-exit-intent-seen", "true");
        
        const message = `Halo Storo.id! Saya tertarik untuk membuat webstore mandiri.%0A%0AEmail: ${encodeURIComponent(validatedData.email)}${validatedData.whatsapp ? `%0AWhatsApp: ${encodeURIComponent(validatedData.whatsapp)}` : ''}`;
        window.open(`https://wa.me/6285148416700?text=${message}`, '_blank');
        
        // Track Google Ads conversion
        trackConversion();
        
        toast({
          title: "Pilihan yang tepat!",
          description: "Tim kami akan segera menghubungi Anda untuk membantu membuat webstore mandiri.",
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
    localStorage.setItem("storo-exit-intent-seen", "true");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-secondary/5 to-primary/5 border-2 border-secondary/20">
        <button 
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
            Yakin Ngga mau Bikin Webstore Mandiri?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Website = brand sendiri. Marketplace = numpang. Yuk bikin webstore sekarang!
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="exit-email">Email *</Label>
            <Input
              id="exit-email"
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
            <Label htmlFor="exit-whatsapp">WhatsApp (Opsional)</Label>
            <Input
              id="exit-whatsapp"
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
            className="w-full bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Mulai Sekarang
          </Button>
        </form>
        
        <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Store className="w-4 h-4" /> Brand Sendiri</span>
          <span className="inline-flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Profit Lebih Besar</span>
          <span className="inline-flex items-center gap-1.5"><Rocket className="w-4 h-4" /> Tanpa Komisi</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExitIntentPopup;
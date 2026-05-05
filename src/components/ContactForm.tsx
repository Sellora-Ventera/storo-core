"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackConversion } from "@/lib/gtag";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Save lead to database via edge function
      const response = await fetch('https://unpqekghcpjclzvpeyse.supabase.co/functions/v1/leads-collector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.phone, // Using phone as identifier since no email in contact form
          whatsapp: formData.phone,
          domain: window.location.hostname,
          project: 'storo-id',
          source: 'contact-form'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save lead');
      }
      
      // Create WhatsApp message
      const waMessage = `Halo Storo.id,%0A%0ANama: ${formData.name}%0ANo. WhatsApp: ${formData.phone}%0APesan: ${formData.message}%0A%0ASaya tertarik dengan layanan webstore dari Storo.id.`;
      
      // Open WhatsApp
      window.open(`https://wa.me/6285157406969?text=${waMessage}`, '_blank');
      
      // Track Google Ads conversion
      trackConversion();
      
      // Show success toast
      toast({
        title: "Pesan Terkirim!",
        description: "Data Anda tersimpan dan kami akan menghubungi Anda segera via WhatsApp.",
      });

      // Reset form
      setFormData({ name: "", phone: "", message: "" });
    } catch (error) {
      console.error('Error saving lead:', error);
      // Still show WhatsApp on error
      const waMessage = `Halo Storo.id,%0A%0ANama: ${formData.name}%0ANo. WhatsApp: ${formData.phone}%0APesan: ${formData.message}%0A%0ASaya tertarik dengan layanan webstore dari Storo.id.`;
      window.open(`https://wa.me/6285157406969?text=${waMessage}`, '_blank');
      
      // Track Google Ads conversion
      trackConversion();
      
      toast({
        title: "Pesan Terkirim!",
        description: "Kami akan menghubungi Anda segera via WhatsApp.",
      });

      setFormData({ name: "", phone: "", message: "" });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contact" className="section-padding bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Hubungi Kami
            </h2>
            <p className="text-lg text-gray-600">
              Kirim pesan singkat untuk konsultasi layanan webstore Storo.id
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Masukkan nama lengkap Anda"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="phone">Nomor WhatsApp</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: 081234567890"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="message">Pesan (Opsional)</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Ceritakan tentang bisnis Shopee Anda atau pertanyaan khusus..."
                  className="mt-2 min-h-[100px]"
                />
              </div>


              <Button type="submit" className="w-full btn-hero">
                Kirim via WhatsApp
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Atau langsung chat WhatsApp: 
                <button 
                  onClick={() => window.open('https://wa.me/6285157406969', '_blank')}
                  className="text-primary font-semibold ml-1 hover:underline"
                >
                  +62 851-4841-6700
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
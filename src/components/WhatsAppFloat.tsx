import { MessageCircle } from "lucide-react";

const WhatsAppFloat = () => {
  return (
    <button
      onClick={() => window.open('https://wa.me/6285148416700?text=Halo%20Storo.id,%20saya%20mau%20konsultasi%20tentang%20webstore', '_blank')}
      className="whatsapp-float"
      aria-label="Chat WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
};

export default WhatsAppFloat;
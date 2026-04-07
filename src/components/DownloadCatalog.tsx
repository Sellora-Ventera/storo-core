"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const DownloadCatalog = () => {
  const [PDFDownloadLink, setPDFDownloadLink] = useState<any>(null);
  const [CatalogPDF, setCatalogPDF] = useState<any>(null);

  useEffect(() => {
    import("@react-pdf/renderer").then((mod) => {
      setPDFDownloadLink(() => mod.PDFDownloadLink);
    });
    import("./CatalogPDF").then((mod) => {
      setCatalogPDF(() => mod.default);
    });
  }, []);

  if (!PDFDownloadLink || !CatalogPDF) {
    return (
      <div className="text-center mt-8">
        <Button className="btn-outline" disabled>
          <Download className="w-4 h-4 mr-2" />
          Memuat PDF...
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center mt-8">
      <PDFDownloadLink document={<CatalogPDF />} fileName="Katalog_Produk_Storo.pdf">
        {({ loading }: { loading: boolean }) => (
          <Button className="btn-outline" disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            {loading ? "Mempersiapkan PDF..." : "Download Katalog PDF"}
          </Button>
        )}
      </PDFDownloadLink>
    </div>
  );
};

export default DownloadCatalog;

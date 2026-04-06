"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

// Dynamically import PDFDownloadLink to prevent SSR issues
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

const CatalogPDF = dynamic(() => import("./CatalogPDF"), { ssr: false });

const DownloadCatalog = () => {
  return (
    <div className="text-center mt-8">
      <PDFDownloadLink
        document={<CatalogPDF />}
        fileName="Katalog_Produk_Storo.pdf"
      >
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

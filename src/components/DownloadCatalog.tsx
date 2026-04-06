import { Button } from "@/components/ui/button";
import { PDFDownloadLink } from '@react-pdf/renderer';
import CatalogPDF from "./CatalogPDF";
import ComprehensiveCatalogPDF from "./ComprehensiveCatalogPDF";
import { Download, FileText } from "lucide-react";

const DownloadCatalog = () => {
  return (
    <div className="text-center mt-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <PDFDownloadLink
          document={<CatalogPDF />}
          fileName="Storo-Katalog-Ringkas.pdf"
        >
          {({ loading }) => (
            <Button
              className="btn-outline"
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-2" />
              {loading ? 'Mempersiapkan PDF...' : 'Download Katalog Ringkas'}
            </Button>
          )}
        </PDFDownloadLink>

        <PDFDownloadLink
          document={<ComprehensiveCatalogPDF />}
          fileName="Storo-Katalog-Lengkap.pdf"
        >
          {({ loading }) => (
            <Button
              className="btn-hero"
              disabled={loading}
            >
              <FileText className="w-4 h-4 mr-2" />
              {loading ? 'Mempersiapkan PDF...' : 'Download Katalog Lengkap (8 hal)'}
            </Button>
          )}
        </PDFDownloadLink>
      </div>
      <p className="text-sm text-gray-600 mt-4">
        Pilih katalog ringkas (2 hal) atau lengkap (8 hal) sesuai kebutuhan
      </p>
    </div>
  );
};

export default DownloadCatalog;

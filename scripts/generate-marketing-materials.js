import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CatalogPDF from '../src/components/CatalogPDF.tsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePDF() {
  const outputDir = path.join(__dirname, '../marketing-materials');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'Storo-Pricing-Catalog.pdf');

  try {
    const stream = await renderToStream(<CatalogPDF />);
    const writeStream = fs.createWriteStream(outputPath);

    stream.pipe(writeStream);

    writeStream.on('finish', () => {
      console.log('✓ PDF generated successfully:', outputPath);
    });

    writeStream.on('error', (err) => {
      console.error('Error writing PDF:', err);
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

generatePDF();

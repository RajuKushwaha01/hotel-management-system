import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download } from 'lucide-react';

export default function QRCodeCard({ title, subtitle, value, filename }) {
  const wrapRef = useRef(null);

  const handleDownload = () => {
    const canvas = wrapRef.current.querySelector('canvas');
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'qr-code.png';
    a.click();
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-darkCard border border-border dark:border-darkBorder text-center animate-fade-in">
      <div ref={wrapRef} className="inline-block p-3 bg-white rounded-xl shadow-sm">
        <QRCodeCanvas value={value} size={180} fgColor="#0F172A" bgColor="#FFFFFF" level="M" includeMargin />
      </div>
      <p className="font-medium mt-4">{title}</p>
      {subtitle && <p className="text-xs text-text-secondary mt-0.5 break-all">{subtitle}</p>}
      <button onClick={handleDownload} className="mt-4 flex items-center gap-1.5 mx-auto text-sm text-gold hover:underline">
        <Download size={14} /> Download QR Code
      </button>
    </div>
  );
}

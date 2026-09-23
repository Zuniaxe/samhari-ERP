import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X } from "lucide-react";

const ScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
    useEffect(() => {
        if (isOpen) {
            const scanner = new Html5QrcodeScanner("reader", {
                fps: 10,
                qrbox: { width: 250, height: 150 },
            });

            scanner.render((decodedText) => {
                scanner.clear();
                onScanSuccess(decodedText);
            }, (error) => { /* ignore error */ });

            return () => scanner.clear();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl w-[400px] shadow-2xl relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-black">
                    <X size={24} />
                </button>
                <h3 className="text-lg font-bold mb-4">Scan Barcode Barang</h3>
                <div id="reader" className="overflow-hidden rounded-lg border"></div>
                <p className="text-xs text-center text-gray-500 mt-4">Arahkan barcode ke dalam kotak kamera</p>
            </div>
        </div>
    );
};
export default ScannerModal;
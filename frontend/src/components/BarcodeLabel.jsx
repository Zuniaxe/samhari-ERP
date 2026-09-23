import Barcode from 'react-barcode';

const BarcodeLabel = ({ sku }) => {
    if (!sku) return <span className="text-[10px] text-gray-300 italic">No SKU</span>;
    return (
        <div className="flex flex-col items-center bg-white p-1 border border-gray-100 rounded scale-90 origin-left group-hover:scale-100 transition-transform">
            <Barcode 
                value={sku} 
                height={25} 
                width={1.1} 
                fontSize={8} 
                margin={0}
            />
        </div>
    );
};
export default BarcodeLabel;
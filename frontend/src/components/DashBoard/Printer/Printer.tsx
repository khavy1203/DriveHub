import React, { useState, useEffect } from 'react';
import { ElectronAPI } from "../../../core/types";

interface Printer {
    name: string;
    isDefault: boolean;
}

const Printer: React.FC = () => {
    const [printers, setPrinters] = useState<Printer[]>([]);
    const [selectedPrinter, setSelectedPrinter] = useState<string>('');
    const [content, setContent] = useState<string>('Nội dung mẫu để in');
    const [isElectron, setIsElectron] = useState<boolean>(false);

    useEffect(() => {
    // Kiểm tra môi trường Electron
        const isRunningInElectron = typeof window !== 'undefined' && !!window.electronAPI;
        setIsElectron(isRunningInElectron);
        if (isRunningInElectron) {
            // Lấy danh sách máy in và tự động chọn máy in mặc định
            window.electronAPI.getPrinters()
                .then((printerList) => {
                    setPrinters(printerList);
                    const defaultPrinter = printerList.find((p) => p.isDefault);
                    if (defaultPrinter) setSelectedPrinter(defaultPrinter.name);
                })
                .catch((error) => {
                    console.error('Lỗi khi lấy danh sách máy in:', error);
                });
        }
    }, []);

    const handlePrinterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedPrinter(e.target.value);
    };

    const handlePrint = () => {
        if (isElectron) {
            if (selectedPrinter) {
                // window.electronAPI.print(content, selectedPrinter, 'two-sided-long-edge');
            } else {
                alert('Vui lòng chọn máy in trước khi in!');
            }
        } else {
            alert('Chức năng in chỉ hoạt động trên ứng dụng Electron!');
        }
    };

    return (
        <div>
            <h2>Chọn máy in</h2>
            {isElectron ? (
                <>
                    <select value={selectedPrinter} onChange={handlePrinterChange}>
                        <option value="">Chọn máy in</option>
                        {printers.map((printer) => (
                            <option key={printer.name} value={printer.name}>
                                {printer.name} {printer.isDefault ? '(Mặc định)' : ''}
                            </option>
                        ))}
                    </select>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={5}
                        cols={50}
                        placeholder="Nhập nội dung để in"
                    />
                    <button onClick={handlePrint}>In</button>
                </>
            ) : (
                <p>Chức năng in không khả dụng trên website. Vui lòng sử dụng ứng dụng Electron.</p>
            )}
        </div>
    );
};

export default Printer;
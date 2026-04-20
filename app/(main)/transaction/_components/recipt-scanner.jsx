"use client";

import { useRef, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { scanReceipt } from "@/actions/transaction";

export function ReceiptScanner({ onScanComplete }) {
    const fileInputRef = useRef(null);
    const onScanCompleteRef = useRef(onScanComplete);

    useEffect(() => {
        onScanCompleteRef.current = onScanComplete;
    }, [onScanComplete]);

    const {
        loading: scanReceiptLoading,
        fn: scanReceiptFn, // means original name is fn but remaned to this
        data: scannedData,
        error: scanReceiptError,
        setData: setScannedData,
    } = useFetch(scanReceipt);

    const fileToBase64 = (file) => { // as our api wants basestring and mintype but browser givs file object then we need to convert that in base 64

        return new Promise((resolve, reject) => {
            const reader = new FileReader(); // reads file like image and ll fro user system.
            reader.onload = () => { // runs after redding the file
                const result = reader.result;
                // result is like "data:<mime>;base64,XXXX"
                const base64 = typeof result === "string" ? result.split(",")[1] : "";
                resolve(base64);  // sends the result back to first line
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file); /// starts the proicess of file to base 64
        });
    };

    const handleReceiptScan = async (file) => {
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size should be less than 5MB");
            return;
        }

        try {
            // Clear any previous scan result to avoid false "success"
            setScannedData(undefined);
            const base64String = await fileToBase64(file);
            await scanReceiptFn({ base64String, mimeType: file.type });
        } catch (error) {
            console.error("Error reading file:", error);
            toast.error("Failed to read receipt file");
        }
    };

    useEffect(() => {
        if (scanReceiptError && !scanReceiptLoading) return;

        if (scannedData && !scanReceiptLoading) {
            console.log("[ReceiptScanner] scannedData:", scannedData);
            const isObject =
                typeof scannedData === "object" && scannedData !== null;

            if (!isObject) {
                toast.error("Scan returned an invalid response");
                return;
            }

            const hasAny = Object.keys(scannedData).length > 0;
            if (!hasAny) {
                toast.error("No receipt data found. Try a clearer photo.");
                return;
            }

            // Require at least amount or description for autofill to make sense
            const hasUseful =
                scannedData.amount !== undefined ||
                (typeof scannedData.description === "string" &&
                    scannedData.description.trim().length > 0);

            if (!hasUseful) {
                toast.error(
                    "Receipt scanned, but amount/description could not be read. You can still fill them manually."
                );
                return;
            }

            onScanCompleteRef.current?.(scannedData);
            toast.success("Receipt scanned successfully");
        }
    }, [scanReceiptLoading, scannedData, scanReceiptError]);

    useEffect(() => {
        if (scanReceiptError && !scanReceiptLoading) {
            console.log("[ReceiptScanner] scanReceiptError:", scanReceiptError);
        }
    }, [scanReceiptLoading, scanReceiptError]);

    return (
        <div className="flex items-center gap-4">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleReceiptScan(file);
                }}
            />
            <Button
                type="button"
                variant="outline"
                className="w-full h-10 bg-linear-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white animate-gradient"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanReceiptLoading}
            >
                {scanReceiptLoading ? (
                    <>
                        <Loader2 className="mr-2 animate-spin" />
                        <span>Scanning Receipt...</span>
                    </>
                ) : (
                    <>
                        <Camera className="mr-2" />
                        <span>Scan Receipt with AI</span>
                    </>
                )}
            </Button>
        </div>
    );
}
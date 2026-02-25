import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon, QrCodeIcon } from "@heroicons/react/24/outline";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  open: boolean;
  onClose: () => void;
  subdomain: string;
  configText: string;
}

export default function QRCodeModal({ open, onClose, subdomain, configText }: Props) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-2xl bg-gray-900 border border-gray-800/50 p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <QrCodeIcon className="w-5 h-5 text-indigo-400" />
              <DialogTitle className="text-lg font-semibold text-white">
                {subdomain}
              </DialogTitle>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-xl">
            <QRCodeSVG
              value={configText}
              size={256}
              level="M"
              marginSize={2}
            />
          </div>

          {/* Instructions */}
          <p className="mt-4 text-xs text-gray-400 text-center">
            Scannez ce QR code avec l'application WireGuard
            pour importer la configuration.
          </p>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

'use client';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <button
      type="button"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0000008c]"
      onClick={onClose}
    >
      <button
        type="button"
        className="bg-white rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </button>
    </button>
  );
}

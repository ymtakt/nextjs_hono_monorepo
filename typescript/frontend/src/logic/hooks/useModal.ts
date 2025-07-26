// hooks/useModal.ts を少し拡張
import { useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useModal = <T = any>(initialOpen: boolean = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [data, setData] = useState<T | null>(null);

  const openModal = (modalData?: T) => {
    setData(modalData || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setData(null);
  };

  return {
    isOpen,
    data,
    openModal,
    closeModal,
  };
};

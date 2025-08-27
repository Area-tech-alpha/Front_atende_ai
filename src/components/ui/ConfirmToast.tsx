import React from 'react';
import { toast } from 'react-toastify';

interface ConfirmToastProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  closeToast: () => void; 
}

const ConfirmToast: React.FC<ConfirmToastProps> = ({ message, onConfirm, onCancel, closeToast }) => {
  const handleConfirm = () => {
    onConfirm();
    closeToast();
  };

  const handleCancel = () => {
    onCancel();
    closeToast();
  };

  return (
    <div className="flex flex-col items-start p-2">
      <p className="text-sm font-medium mb-4">{message}</p>
      <div className="flex justify-end w-full space-x-2">
        <button
          onClick={handleCancel}
          className="btn-secondary text-sm px-4 py-2"
        >
          Não
        </button>
        <button
          onClick={handleConfirm}
          className="btn-primary text-sm px-4 py-2"
        >
          Sim
        </button>
      </div>
    </div>
  );
};

export default ConfirmToast;
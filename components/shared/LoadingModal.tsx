import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";
import spinner from '/public/assets/icons/spinner.svg'; // Adjust the path as needed

type LoadingModalProps = {
  isOpen: boolean;
  message: string;
};

const LoadingModal: React.FC<LoadingModalProps> = ({ isOpen, message }) => (
  <Dialog open={isOpen} aria-labelledby="loading-modal-title" aria-describedby="loading-modal-description">
    <DialogContent className="sm:max-w-[425px]">
      <div className="flex flex-col items-center justify-center">
        <Image src={spinner} alt="Loading" width={38} height={38} className="mb-4" />
        <h2 id="loading-modal-title" className="text-lg font-semibold mb-2">处理中... Processing...</h2>
        <p id="loading-modal-description">{message}</p>
      </div>
    </DialogContent>
  </Dialog>
);

export default LoadingModal;

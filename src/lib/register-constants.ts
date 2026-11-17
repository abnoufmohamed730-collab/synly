import type { Variants } from "framer-motion";

export const serviceTypes = [
  { value: "Mechanical Repair", labelKey: "register.serviceMechanical" },
  { value: "Auto Electric", labelKey: "register.serviceElectric" },
  { value: "Spare Parts Shop", labelKey: "register.serviceSpareParts" },
  { value: "Towing/Roadside Assistance", labelKey: "register.serviceTowing" },
  { value: "Gas Station", labelKey: "register.serviceGas" },
];

export const paymentMethods = [
  { value: "Cash", labelKey: "register.paymentCash" },
  { value: "InstaPay", labelKey: "register.paymentInstaPay" },
  { value: "E-Wallet", labelKey: "register.paymentEWallet" },
  { value: "Vodafone Cash", labelKey: "register.paymentVodafoneCash" },
  { value: "Visa/Mastercard", labelKey: "register.paymentCards" },
];

const currentYear = new Date().getFullYear();
export const years = Array.from(
  { length: currentYear - 1980 + 1 },
  (_, i) => String(currentYear - i)
);

export const stepVariants: Variants = {
  initial: { opacity: 0, x: 40, scale: 0.98 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: -40,
    scale: 0.98,
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

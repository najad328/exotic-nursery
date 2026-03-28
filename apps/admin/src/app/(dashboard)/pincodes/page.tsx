import PincodesClient from "./PincodesClient";

export default function PincodesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Delivery Pincodes
      </h1>
      <PincodesClient />
    </div>
  );
}

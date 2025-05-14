import Image from "next/image";

export default function ChartDisplay({ imageData }: { imageData: string }) {
  if (!imageData) return <p>No chart available</p>;
  // Fix: Remove trailing whitespace/control characters from src
  const safeSrc = imageData.trimEnd();
  return (
    <Image
      src={safeSrc}
      alt="Generated chart"
      width={800}
      height={600}
      style={{
        maxWidth: "100%",
        border: "1px solid #ccc",
        borderRadius: 8,
        height: "auto",
      }}
      unoptimized
    />
  );
}

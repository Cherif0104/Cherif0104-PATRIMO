import Image from "next/image";

export default function Loading() {
  return (
    <div className="grid min-h-[70dvh] place-items-center bg-[#FFFDF7]">
      <div className="brand-reveal text-center">
        <Image src="/brand/mark.png" alt="" width={112} height={112} priority className="mx-auto rounded-[28px]" />
        <p className="mt-4 text-lg font-extrabold tracking-[-0.04em] text-[#182A39]">Se Loger au Sénégal</p>
        <p className="mt-1 text-xs font-semibold tracking-[0.12em] text-[#FF4845]">SÉJOURNER · LOUER · GÉRER</p>
        <span className="mx-auto mt-5 block h-1 w-16 overflow-hidden rounded-full bg-[#ffe5de]">
          <span className="block h-full w-1/2 animate-pulse rounded-full bg-[#FF4845]" />
        </span>
      </div>
    </div>
  );
}

import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex border min-h-screen justify-center items-center">
      <Image
        src="/staredesk-logo.svg"
        alt="landing page"
        width={100}
        height={100}
        loading="eager"
        className="h-80 w-auto"
      />
    </div>
  );
}

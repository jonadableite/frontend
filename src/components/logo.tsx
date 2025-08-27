// src/components/logo.tsx
import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  variant?: "default" | "icon" | "login";
  className?: string;
};

const Logo = ({ variant = "default", className }: LogoProps) => {
  return (
    <Link href="/" className="flex items-center gap-2">
      {" "}
      {variant === "login" && (
        <div className="flex items-center">
          <Image
            src="/favicon.svg"
            alt="WhatLead icon"
            width={32}
            height={32}
            className="mr-2"
          />
          <Image src="/logo.svg" alt="WhatLead logo" width={200} height={91} />
        </div>
      )}
      {variant === "default" && (
        <div className="flex items-center">
          <Image
            src="/favicon.svg"
            alt="WhatLead icon"
            width={32}
            height={32}
            className="mr-2"
          />
          <Image src="/logo.svg" alt="WhatLead logo" width={150} height={31} />
        </div>
      )}
      {variant === "icon" && (
        <Image
          src="/favicon.svg"
          alt="WhatLead logo"
          className={className}
          width={32}
          height={32}
        />
      )}
    </Link>
  );
};

export default Logo;

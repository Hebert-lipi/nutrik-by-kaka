import Image from "next/image";
import { cn } from "@/lib/utils";

/** Logo completa (PNG) — substitui marca em texto onde aplicável. */
export const NUTRIK_LOGO_PUBLIC_PATH = "/images/nutrik-logo.png";

type NutrikBrandImageProps = {
  className?: string;
  /** Altura visual; largura segue proporção da arte */
  height?: number;
  width?: number;
  priority?: boolean;
};

export function NutrikBrandImage({
  className,
  height = 40,
  width = 200,
  priority = false,
}: NutrikBrandImageProps) {
  return (
    <Image
      src={NUTRIK_LOGO_PUBLIC_PATH}
      alt="Nutrik by Kaká"
      width={width}
      height={height}
      priority={priority}
      // Logo deve carregar imediatamente no modo PWA/standalone.
      // `unoptimized` evita depender do endpoint `/_next/image` na primeira renderização.
      unoptimized
      className={cn("h-9 w-auto max-w-[min(100%,11.5rem)] object-contain object-left md:h-10", className)}
    />
  );
}

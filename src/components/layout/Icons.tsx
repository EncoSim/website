import clsx from "clsx";
import LogoSvg from "/assets/logo.svg?react";
import HomeSvg from "/assets/home.svg?react";
import PartySvg from "/assets/party.svg?react";
import SwordsSvg from "/assets/swords.svg?react";

type IconProps = { className?: string };

export function EncosimIcon({ className }: IconProps) {
  return <LogoSvg aria-hidden className={clsx("fill-current", className)} />;
}

export function HomeIcon({ className }: IconProps) {
  return <HomeSvg aria-hodden className={clsx("fill-current", className)} />;
}

export function PartyIcon({ className }: IconProps) {
  return <PartySvg aria-hidden className={clsx("fill-current", className)} />;
}

export function SwordsIcon({ className }: IconProps) {
  return <SwordsSvg aria-hidden className={clsx("fill-current", className)} />;
}


import { Architecture } from "@/components/sections/Architecture";
import { CapabilityStrip } from "@/components/sections/CapabilityStrip";
import { Company } from "@/components/sections/Company";
import { Developer } from "@/components/sections/Developer";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/Hero";
import { MarketData } from "@/components/sections/MarketData";
import { Pillars } from "@/components/sections/Pillars";
import { Products } from "@/components/sections/Products";

export default function Home() {
  return (
    <>
      <Hero />
      <CapabilityStrip />
      <Products />
      <Developer />
      <Architecture />
      <Pillars />
      <Company />
      <MarketData />
      <FinalCta />
    </>
  );
}

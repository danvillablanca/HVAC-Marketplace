import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Faq,
  FinalCta,
  ForProviders,
  Hero,
  HowItWorks,
  SocialProof,
  TrustBar,
  ValueProps,
} from "@/features/landing";

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Reveal>
        <TrustBar />
      </Reveal>
      <Reveal>
        <ValueProps />
      </Reveal>
      <HowItWorks />
      <Reveal>
        <SocialProof />
      </Reveal>
      <Reveal>
        <ForProviders />
      </Reveal>
      <Reveal>
        <Faq />
      </Reveal>
      <Reveal>
        <FinalCta />
      </Reveal>
    </div>
  );
}

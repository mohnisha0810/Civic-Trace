import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  FileText,
  MapPin,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface JourneyStep {
  id: number;
  stage: string;
  title: string;
  subtitle: string;
  narrative: string;
  icon: React.ElementType;
  badge: string;
}

const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 1,
    stage: 'Observe',
    title: 'Visual Evidence Intake',
    subtitle: 'Citizen spots a public defect',
    narrative: 'A photo is captured with device GPS. The interface analyzes the issue category without altering raw evidence.',
    icon: Camera,
    badge: 'Stage 1 • Evidence',
  },
  {
    id: 2,
    stage: 'Report',
    title: 'Ledger Encoding',
    subtitle: 'Transforms into structured grievance',
    narrative: 'The image morphs into a verifiable tracking card with unique ID and mathematical EDPS priority weighting.',
    icon: FileText,
    badge: 'Stage 2 • Structured Card',
  },
  {
    id: 3,
    stage: 'Track',
    title: 'Public Status Journey',
    subtitle: 'Transparent community registry',
    narrative: 'The complaint enters the open municipal registry where neighbors can follow progress and cast upvotes.',
    icon: MapPin,
    badge: 'Stage 3 • Live Tracking',
  },
  {
    id: 4,
    stage: 'Act',
    title: 'Municipal Operations',
    subtitle: 'Field crew dispatch & work order',
    narrative: 'Authorized departments triage the ticket and dispatch binding contractor work orders with SLA deadlines.',
    icon: Wrench,
    badge: 'Stage 4 • Field Crew',
  },
  {
    id: 5,
    stage: 'Resolve',
    title: 'Verified Resolution',
    subtitle: 'Confirmed physical repair proof',
    narrative: 'Field crews submit photographic proof with geofence validation, closing the ticket through community consensus.',
    icon: CheckCircle2,
    badge: 'Stage 5 • Closed Loop',
  },
];

export const HowItWorks: React.FC = () => {
  const [selectedStep, setSelectedStep] = useState<number>(1);
  const activeStep = JOURNEY_STEPS.find((s) => s.id === selectedStep) || JOURNEY_STEPS[0];
  const Icon = activeStep.icon;

  return (
    <section className="py-14 px-4 sm:px-8 border-y border-sage bg-softwhite/90">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-bold text-burnt uppercase tracking-wider px-3 py-1 bg-peach rounded-full inline-flex items-center gap-1.5">
            <Sparkles size={13} />
            <span>Signature Civic Journey</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-forest">
            From Photograph to Verified Resolution
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
            Follow the lifecycle of a civic issue as it moves from citizen intake to physical resolution and community consensus.
          </p>
        </div>

        {/* 5-Stage Interactive Journey Progression */}
        <div className="bg-ivory rounded-3xl p-6 sm:p-8 border border-sage shadow-card space-y-6">
          {/* Top Step Selector Track */}
          <div className="relative">
            {/* Connecting Track Line */}
            <div className="hidden md:block absolute top-1/2 left-8 right-8 h-1 bg-sage -translate-y-1/2 z-0" />
            <motion.div
              initial={false}
              animate={{
                width: `${((selectedStep - 1) / (JOURNEY_STEPS.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="hidden md:block absolute top-1/2 left-8 h-1 bg-forest -translate-y-1/2 z-0 max-w-[calc(100%-4rem)]"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 relative z-10">
              {JOURNEY_STEPS.map((step) => {
                const StepIcon = step.icon;
                const isCurrent = step.id === selectedStep;
                const isPassed = step.id < selectedStep;

                return (
                  <button
                    key={step.id}
                    onClick={() => setSelectedStep(step.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-forest text-softwhite border-forest shadow-card scale-[1.02]'
                        : isPassed
                        ? 'bg-softwhite border-sage hover:border-forest/40 text-charcoal'
                        : 'bg-softwhite/60 border-sage/70 hover:bg-softwhite text-charcoal-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          isCurrent
                            ? 'bg-burnt text-softwhite'
                            : 'bg-sage text-forest'
                        }`}
                      >
                        0{step.id}
                      </span>
                      <StepIcon
                        size={16}
                        className={isCurrent ? 'text-burnt' : 'text-charcoal-muted'}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold block opacity-80">
                        {step.stage}
                      </span>
                      <h4 className="text-xs font-extrabold truncate mt-0.5">
                        {step.title}
                      </h4>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Stage Interactive Showcase Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="bg-softwhite rounded-2xl border border-sage p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3 max-w-xl">
                <span className="text-[10px] font-bold text-burnt uppercase tracking-wider px-2.5 py-0.5 bg-peach rounded-full">
                  {activeStep.badge}
                </span>
                <h3 className="text-xl font-extrabold text-forest">
                  Stage {activeStep.id}: {activeStep.title}
                </h3>
                <p className="text-xs sm:text-sm text-charcoal leading-relaxed">
                  {activeStep.narrative}
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-charcoal-muted pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-forest" />
                  <span>{activeStep.subtitle}</span>
                </div>
              </div>

              {/* Graphical Visual Element of the Active Step */}
              <div className="w-full md:w-64 h-36 rounded-2xl bg-ivory border border-sage flex flex-col items-center justify-center p-4 text-center space-y-2 flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-forest text-softwhite flex items-center justify-center shadow-subtle">
                  <Icon size={24} className="text-burnt" />
                </div>
                <span className="text-xs font-mono font-bold text-forest">
                  CT-LIFECYCLE-0{activeStep.id}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-charcoal-muted">
                  <span>Step {activeStep.id} of 5</span>
                  <ArrowRight size={10} />
                  <span>{activeStep.id === 5 ? 'Verified Closed' : 'Next Stage'}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

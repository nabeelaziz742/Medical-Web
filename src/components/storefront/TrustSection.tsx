import React from "react";
import { Truck, MapPin, Phone } from "lucide-react";
import { STORE_INFO } from "@/lib/constants";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function TrustSection() {
  const features = [
    {
      icon: Truck,
      title: "Home Delivery Available",
      description: "Convenient local delivery service directly to your doorstep across Lahore.",
      color: "text-blue-700 bg-blue-50 border-blue-100",
    },
    {
      icon: MapPin,
      title: "Physical Store in Lahore",
      description: `Established pharmacy location on ${STORE_INFO.address}.`,
      color: "text-emerald-700 bg-emerald-50 border-emerald-100",
    },
    {
      icon: Phone,
      title: "Direct Phone Support",
      description: `Speak directly with store staff: Sharjeel (${STORE_INFO.contacts[0].formatted}) or Sameer (${STORE_INFO.contacts[1].formatted}).`,
      color: "text-indigo-700 bg-indigo-50 border-indigo-100",
    },
  ];

  return (
    <section className="relative py-14 sm:py-16 md:py-20 bg-white border-b border-slate-200 overflow-hidden">
      {/* Subtle Soft Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-50/70 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-4 p-5 sm:p-6 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-subtle hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-slate-900 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-500 mt-1 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}


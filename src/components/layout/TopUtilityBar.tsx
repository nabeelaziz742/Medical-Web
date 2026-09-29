import React from "react";
import { MapPin, Phone, Truck } from "lucide-react";
import { STORE_INFO } from "@/lib/constants";

export function TopUtilityBar() {
  return (
    <div className="bg-slate-950 text-slate-300 text-xs border-b border-slate-800/80 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8.5 flex items-center justify-between">
        
        {/* Left: Physical Location */}
        <div className="flex items-center space-x-1.5 font-medium text-slate-200">
          <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <span>{STORE_INFO.address}</span>
        </div>

        {/* Center: Home Delivery Notice */}
        <div className="hidden md:flex items-center space-x-1.5 text-slate-300 text-xs">
          <Truck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-emerald-400">{STORE_INFO.service}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">Across Lahore</span>
        </div>

        {/* Right: Verified Phone Lines */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-200">
            <Phone className="h-3 w-3 text-blue-400 shrink-0" />
            <span className="hidden sm:inline text-slate-400">Call:</span>
            <a
              href={`tel:${STORE_INFO.contacts[0].phone}`}
              className="hover:text-blue-400 font-medium transition-colors"
            >
              Sharjeel: {STORE_INFO.contacts[0].formatted}
            </a>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center space-x-1.5 text-slate-200">
            <a
              href={`tel:${STORE_INFO.contacts[1].phone}`}
              className="hover:text-blue-400 font-medium transition-colors"
            >
              Sameer: {STORE_INFO.contacts[1].formatted}
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}



import { motion } from 'framer-motion';
import { Globe, ChevronDown } from 'lucide-react';


interface RegionSelectorProps {
  region: string;
  onRegionChange: (region: string) => void;
  disabled?: boolean;
}

const REGION_OPTIONS = [
  {
    value: 'europe',
    label: 'Europe',
    description: 'EUW, EUNE, Turkey, Russia',
    flag: '🇪🇺'
  },
  {
    value: 'americas',
    label: 'Americas',
    description: 'North America, Brazil, Latin America',
    flag: '🌎'
  },
  {
    value: 'asia',
    label: 'Asia',
    description: 'Korea, Japan, Oceania',
    flag: '🌏'
  }
] as const;

export function RegionSelector({ region, onRegionChange, disabled = false }: RegionSelectorProps) {
  const selectedRegion = REGION_OPTIONS.find(option => option.value === region);

  return (
    <div className="space-y-2">
      <label htmlFor="region" className="block text-sm font-medium">
        Region
      </label>
      
      <div className="relative">
        <select
          id="region"
          value={region}
          onChange={(e) => onRegionChange(e.target.value)}
          disabled={disabled}
          className="input pr-10 appearance-none cursor-pointer disabled:cursor-not-allowed"
        >
          {REGION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.flag} {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      
      {/* Region description */}
      {selectedRegion && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden"
        >
          <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-md">
            <Globe className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {selectedRegion.description}
            </p>
          </div>
        </motion.div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Select the region where your League of Legends account is located
      </p>
    </div>
  );
}
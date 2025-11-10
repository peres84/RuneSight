
import { motion } from 'framer-motion';
import { Globe, ChevronDown } from 'lucide-react';


interface RegionSelectorProps {
  region: string;
  onRegionChange: (region: string, regionalRouting: string, platform: string) => void;
  disabled?: boolean;
}

export interface RegionConfig {
  value: string;
  label: string;
  description: string;
  flag: string;
  region: string;
  platform: string;
}

const REGION_OPTIONS: readonly RegionConfig[] = [
  {
    value: 'euw',
    label: 'Europe West',
    description: 'EUW - Western Europe',
    flag: '🇪🇺',
    region: 'EUROPE',
    platform: 'EUW1'
  },
  {
    value: 'eune',
    label: 'Europe Nordic & East',
    description: 'EUNE - Nordic & Eastern Europe',
    flag: '🇪🇺',
    region: 'EUROPE',
    platform: 'EUN1'
  },
  {
    value: 'na',
    label: 'North America',
    description: 'NA - United States, Canada',
    flag: '🇺🇸',
    region: 'AMERICAS',
    platform: 'NA1'
  },
  {
    value: 'br',
    label: 'Brazil',
    description: 'BR - Brazil',
    flag: '🇧🇷',
    region: 'AMERICAS',
    platform: 'BR1'
  },
  {
    value: 'lan',
    label: 'Latin America North',
    description: 'LAN - Mexico, Central America, Caribbean',
    flag: '🌎',
    region: 'AMERICAS',
    platform: 'LA1'
  },
  {
    value: 'las',
    label: 'Latin America South',
    description: 'LAS - South America',
    flag: '🌎',
    region: 'AMERICAS',
    platform: 'LA2'
  },
  {
    value: 'kr',
    label: 'Korea',
    description: 'KR - South Korea',
    flag: '🇰🇷',
    region: 'ASIA',
    platform: 'KR'
  },
  {
    value: 'jp',
    label: 'Japan',
    description: 'JP - Japan',
    flag: '🇯🇵',
    region: 'ASIA',
    platform: 'JP1'
  },
  {
    value: 'oce',
    label: 'Oceania',
    description: 'OCE - Australia, New Zealand',
    flag: '🇦🇺',
    region: 'ASIA',
    platform: 'OC1'
  },
  {
    value: 'tr',
    label: 'Turkey',
    description: 'TR - Turkey',
    flag: '🇹🇷',
    region: 'EUROPE',
    platform: 'TR1'
  },
  {
    value: 'ru',
    label: 'Russia',
    description: 'RU - Russia',
    flag: '🇷🇺',
    region: 'EUROPE',
    platform: 'RU'
  },
  {
    value: 'ph',
    label: 'Philippines',
    description: 'PH - Philippines',
    flag: '🇵🇭',
    region: 'SEA',
    platform: 'PH2'
  },
  {
    value: 'sg',
    label: 'Singapore',
    description: 'SG - Singapore, Malaysia, Indonesia',
    flag: '🇸🇬',
    region: 'SEA',
    platform: 'SG2'
  },
  {
    value: 'th',
    label: 'Thailand',
    description: 'TH - Thailand',
    flag: '🇹🇭',
    region: 'SEA',
    platform: 'TH2'
  },
  {
    value: 'tw',
    label: 'Taiwan',
    description: 'TW - Taiwan, Hong Kong, Macau',
    flag: '🇹🇼',
    region: 'SEA',
    platform: 'TW2'
  },
  {
    value: 'vn',
    label: 'Vietnam',
    description: 'VN - Vietnam',
    flag: '🇻🇳',
    region: 'SEA',
    platform: 'VN2'
  }
] as const;

export function RegionSelector({ region, onRegionChange, disabled = false }: RegionSelectorProps) {
  const selectedRegion = REGION_OPTIONS.find(option => option.value === region);

  const handleChange = (value: string) => {
    const selected = REGION_OPTIONS.find(opt => opt.value === value);
    if (selected) {
      onRegionChange(value, selected.region, selected.platform);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="region" className="block text-sm font-medium">
        Server
      </label>
      
      <div className="relative">
        <select
          id="region"
          value={region}
          onChange={(e) => handleChange(e.target.value)}
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
        Select the server where your League of Legends account is located
      </p>
    </div>
  );
}
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Country {
  code: string;
  name: string;
  flag: string;
}

// Common countries first, then alphabetical
const COUNTRIES: Country[] = [
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: '+43', name: 'Austria', flag: '🇦🇹' },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+32', name: 'Belgium', flag: '🇧🇪' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+855', name: 'Cambodia', flag: '🇰🇭' },
  { code: '+1', name: 'Caribbean', flag: '🌴' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: '+45', name: 'Denmark', flag: '🇩🇰' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬' },
  { code: '+251', name: 'Ethiopia', flag: '🇪🇹' },
  { code: '+358', name: 'Finland', flag: '🇫🇮' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+233', name: 'Ghana', flag: '🇬🇭' },
  { code: '+30', name: 'Greece', flag: '🇬🇷' },
  { code: '+852', name: 'Hong Kong', flag: '🇭🇰' },
  { code: '+36', name: 'Hungary', flag: '🇭🇺' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+98', name: 'Iran', flag: '🇮🇷' },
  { code: '+964', name: 'Iraq', flag: '🇮🇶' },
  { code: '+353', name: 'Ireland', flag: '🇮🇪' },
  { code: '+972', name: 'Israel', flag: '🇮🇱' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+962', name: 'Jordan', flag: '🇯🇴' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+961', name: 'Lebanon', flag: '🇱🇧' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+960', name: 'Maldives', flag: '🇲🇻' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+212', name: 'Morocco', flag: '🇲🇦' },
  { code: '+95', name: 'Myanmar', flag: '🇲🇲' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+47', name: 'Norway', flag: '🇳🇴' },
  { code: '+968', name: 'Oman', flag: '🇴🇲' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: '+48', name: 'Poland', flag: '🇵🇱' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+46', name: 'Sweden', flag: '🇸🇪' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+886', name: 'Taiwan', flag: '🇹🇼' },
  { code: '+255', name: 'Tanzania', flag: '🇹🇿' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: '+90', name: 'Turkey', flag: '🇹🇷' },
  { code: '+256', name: 'Uganda', flag: '🇺🇬' },
  { code: '+380', name: 'Ukraine', flag: '🇺🇦' },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+967', name: 'Yemen', flag: '🇾🇪' },
  { code: '+263', name: 'Zimbabwe', flag: '🇿🇼' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onReset?: () => void;
  disabled?: boolean;
  required?: boolean;
}

function parseValue(v: string): { country: Country; local: string } {
  // Match longest code first to avoid +1 matching before +1284 etc.
  const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  for (const c of sorted) {
    if (v.startsWith(c.code)) {
      return { country: c, local: v.slice(c.code.length) };
    }
  }
  return { country: COUNTRIES[0], local: v };
}

export default function PhoneInput({ value, onChange, onReset, disabled, required }: PhoneInputProps) {
  const parsed = parseValue(value || '+91');
  const [selected, setSelected] = useState<Country>(parsed.country);
  const [localNumber, setLocalNumber] = useState(parsed.local);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  const selectCountry = (country: Country) => {
    setSelected(country);
    setOpen(false);
    setSearch('');
    onChange(country.code + localNumber);
    if (onReset) onReset();
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setLocalNumber(digits);
    onChange(selected.code + digits);
    if (onReset) onReset();
  };

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
  );

  // Deduplicate by name for display (keep first occurrence)
  const seen = new Set<string>();
  const deduped = filtered.filter((c) => {
    const key = `${c.name}-${c.code}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="flex gap-2 relative" ref={dropdownRef}>
      {/* Country selector button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-saffron-400 focus:outline-none focus:border-saffron-500 transition-colors font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-lg leading-none">{selected.flag}</span>
        <span className="text-gray-700">{selected.code}</span>
        <ChevronDown
          size={13}
          className={`text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg">
              <Search size={13} className="text-gray-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search country or code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {deduped.length === 0 ? (
              <div className="px-3 py-5 text-center text-sm text-gray-400">No countries found</div>
            ) : (
              deduped.map((c) => (
                <button
                  key={`${c.name}-${c.code}`}
                  type="button"
                  onClick={() => selectCountry(c)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-orange-50 transition-colors text-left ${
                    selected.name === c.name && selected.code === c.code
                      ? 'bg-orange-50 text-saffron-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  <span className="text-base leading-none w-6 flex-shrink-0">{c.flag}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-gray-400 font-mono text-xs flex-shrink-0">{c.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Local number input */}
      <input
        type="tel"
        className="input flex-1 min-w-0"
        placeholder="9876543210"
        value={localNumber}
        onChange={handleLocalChange}
        disabled={disabled}
        required={required}
        inputMode="numeric"
      />
    </div>
  );
}

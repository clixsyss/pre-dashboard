import React from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedText } from '../utils/i18nHelpers';

/**
 * BilingualDisplay Component
 * Displays bilingual data based on current language
 * 
 * Usage:
 * <BilingualDisplay 
 *   data={service.name} 
 *   fallback="Unnamed"
 * />
 */
const BilingualDisplay = ({ 
  data, 
  fallback = '', 
  className = '',
  showBothLanguages = false 
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  
  // If showing both languages, display them side by side
  if (showBothLanguages && typeof data === 'object' && data !== null && !Array.isArray(data)) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {data.en && (
          <div className="text-sm">
            <span className="font-medium text-gray-500">EN:</span>
            <span className="ml-2">{data.en}</span>
          </div>
        )}
        {data.ar && (
          <div className="text-sm" dir="rtl">
            <span className="font-medium text-gray-500">AR:</span>
            <span className="mr-2">{data.ar}</span>
          </div>
        )}
      </div>
    );
  }
  
  // Otherwise, show only the current language
  const text = getLocalizedText(data, currentLang, fallback);
  
  return (
    <span className={className}>
      {text}
    </span>
  );
};

export default BilingualDisplay;


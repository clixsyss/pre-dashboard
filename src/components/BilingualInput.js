import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * BilingualInput Component
 * A reusable component for entering bilingual text (English + Arabic)
 * 
 * Usage:
 * <BilingualInput
 *   label="Service Name"
 *   valueEn={formData.name_en}
 *   valueAr={formData.name_ar}
 *   onChangeEn={(e) => setFormData({...formData, name_en: e.target.value})}
 *   onChangeAr={(e) => setFormData({...formData, name_ar: e.target.value})}
 *   required
 * />
 */
const BilingualInput = ({
  label,
  valueEn = '',
  valueAr = '',
  onChangeEn,
  onChangeAr,
  required = false,
  type = 'text',
  multiline = false,
  rows = 4,
  placeholder = '',
  error = '',
  disabled = false,
  className = ''
}) => {
  const { t } = useTranslation();
  
  const baseInputClasses = `
    w-full px-4 py-2 border border-gray-300 rounded-lg
    focus:outline-none focus:ring-2 focus:ring-pre-red focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
    transition-all duration-200
  `;
  
  const textareaClasses = `
    ${baseInputClasses}
    resize-vertical
  `;
  
  const InputComponent = multiline ? 'textarea' : 'input';
  
  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* English Input */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
          {t('bilingual.englishVersion')}
        </label>
        <InputComponent
          type={!multiline ? type : undefined}
          rows={multiline ? rows : undefined}
          value={valueEn}
          onChange={onChangeEn}
          placeholder={placeholder ? `${placeholder} (English)` : 'Enter English text'}
          required={required}
          disabled={disabled}
          className={multiline ? textareaClasses : baseInputClasses}
          dir="ltr"
        />
      </div>
      
      {/* Arabic Input */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
          {t('bilingual.arabicVersion')}
        </label>
        <InputComponent
          type={!multiline ? type : undefined}
          rows={multiline ? rows : undefined}
          value={valueAr}
          onChange={onChangeAr}
          placeholder={placeholder ? `${placeholder} (عربي)` : 'أدخل النص بالعربية'}
          required={required}
          disabled={disabled}
          className={multiline ? textareaClasses : baseInputClasses}
          dir="rtl"
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default BilingualInput;


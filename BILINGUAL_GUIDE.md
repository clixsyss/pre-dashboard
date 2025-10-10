# PRE Dashboard - Bilingual Support Guide (English + Arabic)

This guide explains how to use the bilingual features in the PRE Group Admin Dashboard.

## Table of Contents
1. [Overview](#overview)
2. [Setup](#setup)
3. [Using Translations](#using-translations)
4. [Bilingual Components](#bilingual-components)
5. [Working with Bilingual Data](#working-with-bilingual-data)
6. [RTL Support](#rtl-support)
7. [Examples](#examples)
8. [Best Practices](#best-practices)

---

## Overview

The PRE Dashboard supports English and Arabic with:
- **React i18next** for UI translations
- **Automatic RTL layout** for Arabic
- **Bilingual input components** for forms
- **Bilingual display components** for data
- **Language switcher** in the navigation
- **Persistent language preference** in localStorage

---

## Setup

### Installation

The required packages are already in `package.json`:

```json
{
  "i18next": "^23.7.6",
  "i18next-browser-languagedetector": "^7.2.0",
  "react-i18next": "^13.5.0"
}
```

Install them:

```bash
cd pre-dashboard
npm install
```

### Configuration

The i18n configuration is already set up in `/src/i18n/i18n.js`. It automatically:
- Detects browser language
- Saves preference to localStorage
- Sets HTML `dir` attribute
- Applies RTL styles when Arabic is selected

---

## Using Translations

### Basic Usage in Components

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>
      <p>{t('dashboard.overview')}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### Translation Keys

Translation keys are organized in JSON files:
- `/src/i18n/locales/en.json` - English translations
- `/src/i18n/locales/ar.json` - Arabic translations

Example structure:

```json
{
  "dashboard": {
    "welcome": "Welcome to PRE Group Dashboard",
    "overview": "Overview"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  }
}
```

### Getting Current Language

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { i18n } = useTranslation();
  
  const currentLang = i18n.language; // 'en' or 'ar'
  const isRTL = currentLang === 'ar';
  
  return <div>{currentLang}</div>;
}
```

### Changing Language Programmatically

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { i18n } = useTranslation();
  
  const switchToArabic = () => {
    i18n.changeLanguage('ar');
  };
  
  const switchToEnglish = () => {
    i18n.changeLanguage('en');
  };
  
  return (
    <div>
      <button onClick={switchToEnglish}>English</button>
      <button onClick={switchToArabic}>العربية</button>
    </div>
  );
}
```

---

## Bilingual Components

### LanguageSwitcher

A dropdown component for switching languages:

```jsx
import LanguageSwitcher from './components/LanguageSwitcher';

function Header() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  );
}
```

### BilingualInput

For forms that need both English and Arabic input:

```jsx
import BilingualInput from './components/BilingualInput';

function ServiceForm() {
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: ''
  });
  
  return (
    <form>
      <BilingualInput
        label="Service Name"
        valueEn={formData.name_en}
        valueAr={formData.name_ar}
        onChangeEn={(e) => setFormData({...formData, name_en: e.target.value})}
        onChangeAr={(e) => setFormData({...formData, name_ar: e.target.value})}
        required
      />
      
      <BilingualInput
        label="Description"
        valueEn={formData.description_en}
        valueAr={formData.description_ar}
        onChangeEn={(e) => setFormData({...formData, description_en: e.target.value})}
        onChangeAr={(e) => setFormData({...formData, description_ar: e.target.value})}
        multiline
        rows={4}
      />
    </form>
  );
}
```

**Props:**
- `label` - Label for the input group
- `valueEn` - English value
- `valueAr` - Arabic value
- `onChangeEn` - English input change handler
- `onChangeAr` - Arabic input change handler
- `required` - Whether both fields are required
- `type` - Input type (text, email, number, etc.)
- `multiline` - Use textarea instead of input
- `rows` - Number of rows for textarea
- `placeholder` - Placeholder text
- `error` - Error message to display
- `disabled` - Disable inputs

### BilingualDisplay

For displaying bilingual data:

```jsx
import BilingualDisplay from './components/BilingualDisplay';

function ServiceCard({ service }) {
  return (
    <div>
      <h2>
        <BilingualDisplay 
          data={service.name} 
          fallback="Unnamed Service"
        />
      </h2>
      <p>
        <BilingualDisplay 
          data={service.description}
        />
      </p>
      
      {/* Show both languages */}
      <BilingualDisplay 
        data={service.name}
        showBothLanguages
      />
    </div>
  );
}
```

**Props:**
- `data` - Bilingual data object `{ en: '...', ar: '...' }` or string
- `fallback` - Fallback text if data is empty
- `className` - CSS classes
- `showBothLanguages` - Display both English and Arabic side by side

---

## Working with Bilingual Data

### Helper Functions

Located in `/src/utils/i18nHelpers.js`:

```jsx
import {
  getLocalizedText,
  createBilingualField,
  isBilingualField,
  extractBilingualValues,
  validateBilingual,
  prepareBilingualData,
  extractFormData
} from './utils/i18nHelpers';
```

#### getLocalizedText

Get text in current language:

```jsx
const name = getLocalizedText(service.name, i18n.language, 'Unnamed');
```

#### createBilingualField

Create bilingual object:

```jsx
const field = createBilingualField('English text', 'النص العربي');
// Returns: { en: 'English text', ar: 'النص العربي' }
```

#### isBilingualField

Check if field is bilingual:

```jsx
if (isBilingualField(service.name)) {
  // Handle bilingual field
}
```

#### prepareBilingualData

Prepare form data for Firestore:

```jsx
const formData = {
  name_en: 'Swimming Pool',
  name_ar: 'حمام السباحة',
  price: 100
};

const firestoreData = prepareBilingualData(formData, ['name']);
// Returns: { name: { en: 'Swimming Pool', ar: 'حمام السباحة' }, price: 100 }
```

#### extractFormData

Extract form data from Firestore:

```jsx
const firestoreData = {
  name: { en: 'Swimming Pool', ar: 'حمام السباحة' },
  price: 100
};

const formData = extractFormData(firestoreData, ['name']);
// Returns: { name_en: 'Swimming Pool', name_ar: 'حمام السباحة', price: 100 }
```

---

## RTL Support

RTL (Right-to-Left) is automatically applied when Arabic is selected.

### Custom RTL Styles

Add RTL-specific styles in your component:

```css
.my-component {
  margin-left: 20px;
}

[dir="rtl"] .my-component {
  margin-left: 0;
  margin-right: 20px;
}
```

### Conditional Rendering for RTL

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  return (
    <div className={isRTL ? 'flex-row-reverse' : 'flex-row'}>
      {/* Content */}
    </div>
  );
}
```

---

## Examples

### Complete Form Example

```jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BilingualInput from './components/BilingualInput';
import { prepareBilingualData, validateBilingual } from './utils/i18nHelpers';

function AddServiceForm() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    price: ''
  });
  const [errors, setErrors] = useState({});
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const newErrors = {};
    if (!formData.name_en || !formData.name_ar) {
      newErrors.name = t('bilingual.bothLanguagesRequired');
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Prepare data for Firestore
    const firestoreData = prepareBilingualData(formData, ['name', 'description']);
    
    // Save to Firestore
    try {
      await saveToFirestore(firestoreData);
      alert(t('messages.saveSuccess'));
    } catch (error) {
      alert(t('messages.error'));
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <BilingualInput
        label={t('services.serviceName')}
        valueEn={formData.name_en}
        valueAr={formData.name_ar}
        onChangeEn={(e) => setFormData({...formData, name_en: e.target.value})}
        onChangeAr={(e) => setFormData({...formData, name_ar: e.target.value})}
        required
        error={errors.name}
      />
      
      <BilingualInput
        label={t('services.description')}
        valueEn={formData.description_en}
        valueAr={formData.description_ar}
        onChangeEn={(e) => setFormData({...formData, description_en: e.target.value})}
        onChangeAr={(e) => setFormData({...formData, description_ar: e.target.value})}
        multiline
        rows={4}
      />
      
      <div>
        <label>{t('services.price')}</label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({...formData, price: e.target.value})}
          required
        />
      </div>
      
      <button type="submit">{t('common.save')}</button>
    </form>
  );
}
```

### Data Display Example

```jsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BilingualDisplay from './components/BilingualDisplay';
import { getLocalizedText } from './utils/i18nHelpers';

function ServicesList() {
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState([]);
  
  useEffect(() => {
    // Fetch from Firestore
    fetchServices().then(setServices);
  }, []);
  
  return (
    <div>
      <h1>{t('services.title')}</h1>
      
      <div className="grid grid-cols-3 gap-4">
        {services.map(service => (
          <div key={service.id} className="card">
            <h2>
              <BilingualDisplay data={service.name} />
            </h2>
            <p>
              <BilingualDisplay data={service.description} />
            </p>
            <p>{service.price} SAR</p>
            
            {/* Or use helper function */}
            <h3>{getLocalizedText(service.category, i18n.language)}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Best Practices

### 1. Always Use Translation Keys

❌ **Bad:**
```jsx
<h1>Welcome to Dashboard</h1>
```

✅ **Good:**
```jsx
<h1>{t('dashboard.welcome')}</h1>
```

### 2. Use BilingualInput for All Text Fields

For any user-facing text that will be displayed in the mobile app, use `BilingualInput`:

```jsx
<BilingualInput
  label="Service Name"
  valueEn={name_en}
  valueAr={name_ar}
  onChangeEn={handleEnChange}
  onChangeAr={handleArChange}
  required
/>
```

### 3. Validate Both Languages

```jsx
const validateForm = () => {
  if (!formData.name_en || !formData.name_ar) {
    setError('Both English and Arabic names are required');
    return false;
  }
  return true;
};
```

### 4. Use Helper Functions

```jsx
// When saving to Firestore
const firestoreData = prepareBilingualData(formData, ['name', 'description']);

// When loading from Firestore
const formData = extractFormData(firestoreData, ['name', 'description']);
```

### 5. Test Both Languages

Always test your forms and displays in both English and Arabic:
- Switch language using the language switcher
- Check RTL layout
- Verify text alignment
- Test form submission

### 6. Keep Translations Organized

Use a hierarchical structure in translation files:

```json
{
  "services": {
    "title": "Service Management",
    "add": "Add Service",
    "edit": "Edit Service",
    "form": {
      "name": "Service Name",
      "description": "Description"
    }
  }
}
```

---

## Adding New Translations

### 1. Add to English File

Edit `/src/i18n/locales/en.json`:

```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my feature"
  }
}
```

### 2. Add to Arabic File

Edit `/src/i18n/locales/ar.json`:

```json
{
  "myFeature": {
    "title": "ميزتي",
    "description": "هذه هي ميزتي"
  }
}
```

### 3. Use in Component

```jsx
<h1>{t('myFeature.title')}</h1>
<p>{t('myFeature.description')}</p>
```

---

## Troubleshooting

### Language not switching
- Check browser console for errors
- Verify localStorage has `dashboard-language` key
- Clear cache and reload

### RTL not applying
- Check HTML `dir` attribute in DevTools
- Verify i18n is initialized before components mount
- Check for CSS conflicts

### Translations not showing
- Verify translation key exists in both language files
- Check for typos in key names
- Restart dev server after adding new translations

### BilingualInput not saving
- Verify you're using `prepareBilingualData` before saving to Firestore
- Check field names match (with or without `_en`/`_ar` suffix)
- Ensure both values are provided

---

## Support

For questions or issues:
1. Check this guide
2. Review `/src/utils/i18nHelpers.js` for available utilities
3. Check `/src/components/BilingualInput.js` and `/src/components/BilingualDisplay.js`
4. Contact the development team


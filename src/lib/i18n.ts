import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../../locales/en.json';
import sv from '../../locales/sv.json';
import fr from '../../locales/fr.json';
import { loadPersistedLanguage } from '@/src/features/language/use-language';

const supported = ['en', 'sv', 'fr'];
// Default is English; persisted preference is applied asynchronously below
const defaultLng = 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    sv: { translation: sv },
    fr: { translation: fr },
  },
  lng: defaultLng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Apply persisted language preference after init (async)
loadPersistedLanguage().then((saved) => {
  if (saved && supported.includes(saved) && saved !== i18n.language) {
    i18n.changeLanguage(saved);
  }
});

export default i18n;

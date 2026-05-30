export const getTranslatedHabit = (habit, currentLanguage, t) => {
  if (!habit) return { title: '', description: '' };

  const langKey = currentLanguage ? currentLanguage.split('-')[0].split('_')[0].toLowerCase() : 'en';

  // Support both camelCase and PascalCase properties for titleTranslations / descriptionTranslations
  const titleTrans = habit.titleTranslations || habit.TitleTranslations;
  const descTrans = habit.descriptionTranslations || habit.DescriptionTranslations;

  let title = habit.title || '';
  if (titleTrans && typeof titleTrans === 'object') {
    title = titleTrans[langKey] || titleTrans['en'] || title;
  } else if (title) {
    // Fallback to local translations keys in localization JSON files
    const titleKey = title.toLowerCase().replace(/\s+/g, '_');
    if (t) {
      title = t(`habits.${titleKey}`, { defaultValue: title });
    }
  }

  let description = habit.description || '';
  if (descTrans && typeof descTrans === 'object') {
    description = descTrans[langKey] || descTrans['en'] || description;
  } else if (title) {
    // Fallback to local translations keys in localization JSON files
    const titleKey = title.toLowerCase().replace(/\s+/g, '_');
    if (t) {
      description = t(`habits.${titleKey}_desc`, { defaultValue: description || title });
    }
  }

  return { title, description };
};

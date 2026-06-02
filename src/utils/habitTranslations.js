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

export const getTranslatedCategory = (category, currentLanguage, t) => {
  if (!category) return '';

  // If category is a string
  if (typeof category === 'string') {
    const nameKey = category.toLowerCase().trim().replace(/[\s&]+/g, '_');
    if (t) {
      return t(`categories.${nameKey}`, { defaultValue: category });
    }
    return category;
  }

  // If category is an object
  const langKey = currentLanguage ? currentLanguage.split('-')[0].split('_')[0].toLowerCase() : 'en';
  const nameTrans = category.nameTranslations || category.NameTranslations;

  let name = category.name || '';
  if (nameTrans && typeof nameTrans === 'object') {
    name = nameTrans[langKey] || nameTrans['en'] || name;
  } else if (name) {
    const nameKey = name.toLowerCase().trim().replace(/[\s&]+/g, '_');
    if (t) {
      name = t(`categories.${nameKey}`, { defaultValue: name });
    }
  }

  return name;
};


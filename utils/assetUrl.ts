export const resolveAssetUrl = (
  value: string | undefined,
  legacyFolder?: 'legends' | 'icons' | 'weapons' | 'ammo'
): string => {
  if (!value || typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  if (legacyFolder) {
    return `/${legacyFolder}/${trimmed}`;
  }

  return `/${trimmed}`;
};

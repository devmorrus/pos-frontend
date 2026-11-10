const accents = [
  "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300",
  "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-300",
  "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-300",
  "bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-300",
  "bg-theme-purple-500/10 text-theme-purple-500",
  "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/10 dark:text-blue-light-300",
];

export function accentFor(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index)) % accents.length;
  }
  return accents[hash];
}

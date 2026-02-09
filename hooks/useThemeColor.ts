import { useTheme } from 'tamagui'

export function useThemeColor() {
  const theme = useTheme()

  return {
    // Text colors
    color: theme.color?.get() as string,
    colorSubtle: theme.colorSubtle?.get() as string,
    colorMuted: theme.colorMuted?.get() as string,
    placeholderColor: theme.placeholderColor?.get() as string,
    // Backgrounds
    background: theme.background?.get() as string,
    backgroundHover: theme.backgroundHover?.get() as string,
    backgroundStrong: theme.backgroundStrong?.get() as string,
    // Brand
    brandText: theme.brandText?.get() as string,
    brandBackground: theme.brandBackground?.get() as string,
    brandBackgroundHover: theme.brandBackgroundHover?.get() as string,
    // Paper
    paperText: theme.paperText?.get() as string,
    // Icons
    iconColor: theme.iconColor?.get() as string,
    iconColorStrong: theme.iconColorStrong?.get() as string,
    // Border
    borderColor: theme.borderColor?.get() as string,
    // Accents
    accentColor: theme.accentColor?.get() as string,
    accentColorMuted: theme.accentColorMuted?.get() as string,
    successColor: theme.successColor?.get() as string,
    warningColor: theme.warningColor?.get() as string,
    errorColor: theme.errorColor?.get() as string,
    infoColor: theme.infoColor?.get() as string,
  }
}

import { tr } from "./i18n";

/**
 * The display name of a swatch or avatar colour ("red" -> "Red"), in the user's language.
 * Used as the pickers' tooltip and accessible name. Call it while rendering.
 */
export function colorName(color: string): string {
  switch (color) {
    case "gray":
      return tr("<trn-ui-color-gray>", "Gray");
    case "red":
      return tr("<trn-ui-color-red>", "Red");
    case "orange":
      return tr("<trn-ui-color-orange>", "Orange");
    case "yellow":
      return tr("<trn-ui-color-yellow>", "Yellow");
    case "amber":
      return tr("<trn-ui-color-amber>", "Amber");
    case "lime":
      return tr("<trn-ui-color-lime>", "Lime");
    case "green":
      return tr("<trn-ui-color-green>", "Green");
    case "teal":
      return tr("<trn-ui-color-teal>", "Teal");
    case "cyan":
      return tr("<trn-ui-color-cyan>", "Cyan");
    case "blue":
      return tr("<trn-ui-color-blue>", "Blue");
    case "indigo":
      return tr("<trn-ui-color-indigo>", "Indigo");
    case "purple":
      return tr("<trn-ui-color-purple>", "Purple");
    case "pink":
      return tr("<trn-ui-color-pink>", "Pink");
    default:
      return color[0].toUpperCase() + color.slice(1);
  }
}

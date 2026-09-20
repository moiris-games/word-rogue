import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";

/**
 * A subtree that stays left-to-right no matter which way the UI runs (UI-021).
 *
 * The Sentence Line, the hand, the toolbelt tray and any English example live
 * inside one of these. The mechanism is the `direction` layout style (TEC-061),
 * set once on the container — never a per-screen flexDirection flip, which is
 * how RTL bugs get written.
 *
 * This component and its folder are exempt from the physical-edge lint rule of
 * TEC-063: inside an LTR island, left and right mean what they say.
 */
export function LtrIsland({
  children,
  style,
  ...props
}: ViewProps & { children: ReactNode }) {
  return (
    <View {...props} style={[{ direction: "ltr" }, style]}>
      {children}
    </View>
  );
}

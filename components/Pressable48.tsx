import { forwardRef } from "react";
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  type View,
} from "react-native";
import { MIN_TOUCH_TARGET } from "@/constants/theme";

export interface Pressable48Props extends Omit<PressableProps, "accessibilityLabel"> {
  /**
   * Required, not optional: UI-046 needs every control announced by TalkBack,
   * and a label that is easy to forget is a label that gets forgotten.
   */
  accessibilityLabel: string;
}

/**
 * The only touchable in the app (UI-047).
 *
 * It guarantees the 48 dp minimum of UI-040 and forces an accessibility label.
 * A lint rule forbids raw Pressable / Touchable* outside this file, which is
 * what makes TST-040 a structural check rather than a visual one.
 */
export const Pressable48 = forwardRef<View, Pressable48Props>(function Pressable48(
  { style, hitSlop, ...props },
  ref,
) {
  return (
    <Pressable
      ref={ref}
      hitSlop={hitSlop ?? 8}
      style={(state) => [
        styles.base,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  base: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
});

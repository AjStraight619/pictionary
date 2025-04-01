import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

type DoodleElementProps = {
  children: React.ReactNode;
  style?: any;
  className?: string;
};

export function DoodleElement({
  children,
  style,
  className,
}: DoodleElementProps) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withRepeat(
            withSequence(
              withDelay(
                1000,
                withTiming(-10, {
                  duration: 2000,
                  easing: Easing.inOut(Easing.ease),
                })
              ),
              withDelay(
                1000,
                withTiming(0, {
                  duration: 2000,
                  easing: Easing.inOut(Easing.ease),
                })
              )
            ),
            -1,
            true
          ),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    pointerEvents: "none",
  },
});

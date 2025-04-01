import { View, StyleSheet } from "react-native";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { DoodleElement } from "./DoodleElement";

export function DoodleElements() {
  return (
    <View style={styles.container}>
      {/* Cloud doodle */}
      <DoodleElement style={styles.cloud}>
        <Svg width={250} height={120} viewBox="0 0 250 120" fill="none">
          <Path
            d="M54.5 78.5C25.7 78.5 2 61.3 2 40C2 18.7 25.7 1.5 54.5 1.5C67.9 1.5 80.2 6.2 89 14C97.9 5.8 110.6 1 124.5 1C152.4 1 175 17.9 175 38.5C175 40.3 174.8 42 174.5 43.7C210.4 46.1 239 66.2 239 90.5C239 116.1 206.8 137 167 137C141.9 137 119.8 128.5 107 115.3C98.9 120.3 88.8 123.5 78 123.5C49.2 123.5 25.5 106.3 25.5 85C25.5 83.9 25.6 82.8 25.7 81.7C16.9 80.5 9.1 77.8 3 73.9"
            stroke="white"
            strokeWidth={4}
            strokeLinecap="round"
          />
        </Svg>
      </DoodleElement>

      {/* Balloon doodle */}
      <DoodleElement style={styles.balloon}>
        <Svg width={100} height={120} viewBox="0 0 100 120" fill="none">
          <Path
            d="M50 10C50 10 60 0 70 0C80 0 90 10 90 20C90 30 80 40 70 40C60 40 50 30 50 20C50 10 50 10 50 10Z"
            stroke="white"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Path
            d="M50 40L50 60"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      </DoodleElement>

      {/* Heart doodle */}
      <DoodleElement style={styles.heart}>
        <Svg width={80} height={80} viewBox="0 0 80 80" fill="none">
          <Path
            d="M40 70C40 70 60 50 60 30C60 20 50 10 40 10C30 10 20 20 20 30C20 50 40 70 40 70Z"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      </DoodleElement>

      {/* Star doodle */}
      <DoodleElement style={styles.star}>
        <Svg width={60} height={60} viewBox="0 0 60 60" fill="none">
          <Path
            d="M30 5L35 20H50L40 30L45 45L30 35L15 45L20 30L10 20H25L30 5Z"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </DoodleElement>

      {/* Circle doodle */}
      <DoodleElement style={styles.circle}>
        <Svg width={60} height={60} viewBox="0 0 60 60" fill="none">
          <Circle
            cx={30}
            cy={30}
            r={25}
            stroke="white"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        </Svg>
      </DoodleElement>

      {/* Moon doodle */}
      <DoodleElement style={styles.moon}>
        <Svg width={80} height={80} viewBox="0 0 80 80" fill="none">
          <Path
            d="M40 10C50 10 60 20 60 30C60 40 50 50 40 50C30 50 20 40 20 30C20 20 30 10 40 10Z"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      </DoodleElement>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    opacity: 0.2,
  },
  cloud: {
    top: -10,
    left: -20,
  },
  balloon: {
    top: "20%",
    right: "10%",
  },
  heart: {
    bottom: "40%",
    left: "10%",
  },
  star: {
    top: "50%",
    left: "5%",
  },
  circle: {
    top: "66%",
    right: "20%",
  },
  moon: {
    top: "25%",
    right: "33%",
  },
});

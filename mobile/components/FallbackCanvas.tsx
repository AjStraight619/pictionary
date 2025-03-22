import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from "react-native-gesture-handler";
import Svg, { Path, G, Rect } from "react-native-svg";
import { SelectedTool } from "../types/canvas";

const { width } = Dimensions.get("window");
const CANVAS_HEIGHT = width * 0.8; // 4:3 aspect ratio
const STROKE_WIDTH = 4;

interface DrawingCanvasProps {
  isDrawing: boolean;
  onDrawingData?: (path: string, color: string, strokeWidth: number) => void;
}

interface PathData {
  d: string;
  stroke: string;
  strokeWidth: number;
  key: string;
}

const FallbackCanvas: React.FC<DrawingCanvasProps> = ({
  isDrawing,
  onDrawingData,
}) => {
  const [paths, setPaths] = useState<PathData[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [currentColor, setCurrentColor] = useState<string>("#000000");
  const [selectedTool] = useState<SelectedTool>(SelectedTool.Pencil);

  // Use refs to track the current drawing state
  const isDrawingRef = useRef(false);
  const pathRef = useRef("");

  // Add a debug touch to verify touch area is working
  const debugTouch = () => {
    Alert.alert("Touch received", "Canvas touch area is working");

    // Create a test drawing - make it large and bright red for visibility
    const testPath = "M50,50 L250,50 L250,200 L50,200 Z";
    const newPath: PathData = {
      d: testPath,
      stroke: "#FF0000", // Bright red
      strokeWidth: 8, // Thicker line
      key: `path-${Date.now()}`,
    };

    // Clear existing paths and add the test path
    setPaths([newPath]);
    console.log("Added test path:", testPath);
  };

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    console.log("SVG Gesture event:", event.nativeEvent.state);

    // Always force drawing on for debugging
    const canDraw = true; // isDrawing;

    if (!canDraw) {
      console.log("Cannot draw - isDrawing is false");
      return;
    }

    const { x, y } = event.nativeEvent;

    // Start a new path
    if (event.nativeEvent.state === State.BEGAN) {
      console.log("SVG Drawing started at", x, y);
      isDrawingRef.current = true;
      const newPath = `M${x.toFixed(2)},${y.toFixed(2)}`;
      pathRef.current = newPath;
      setCurrentPath(newPath);
    }
    // Continue the current path
    else if (event.nativeEvent.state === State.ACTIVE) {
      console.log("SVG Drawing continuing at", x, y);
      if (isDrawingRef.current) {
        const updatedPath = `${pathRef.current} L${x.toFixed(2)},${y.toFixed(
          2
        )}`;
        pathRef.current = updatedPath;
        setCurrentPath(updatedPath);

        // Temporary hack to see if paths render: Always add current state to paths array
        // This will be less efficient but helps diagnose rendering issues
        const tempPath: PathData = {
          d: updatedPath,
          stroke: currentColor,
          strokeWidth: STROKE_WIDTH,
          key: `temp-${Date.now()}`,
        };
        setPaths((prevPaths) => [...prevPaths, tempPath]);
      }
    }
  };

  const onGestureStateChange = (event: PanGestureHandlerGestureEvent) => {
    console.log("SVG Gesture state changed:", event.nativeEvent.state);

    // Always force drawing on for debugging
    const canDraw = true; // isDrawing;

    if (!canDraw) {
      console.log("Cannot draw - isDrawing is false on state change");
      return;
    }

    // When the gesture ends
    if (event.nativeEvent.state === State.END) {
      console.log("SVG Drawing ended");
      if (pathRef.current) {
        console.log(
          "SVG Path completed:",
          pathRef.current.substring(0, 30) + "..."
        );

        // Add the completed path to the paths array
        const newPath: PathData = {
          d: pathRef.current,
          stroke: currentColor,
          strokeWidth: STROKE_WIDTH,
          key: `path-${Date.now()}`,
        };

        setPaths((prevPaths) => {
          console.log("Adding SVG path, new count:", prevPaths.length + 1);
          return [...prevPaths, newPath];
        });

        // Send the final path to the server
        if (onDrawingData) {
          console.log(
            "Sending SVG drawing data:",
            pathRef.current.substring(0, 30) + "..."
          );
          onDrawingData(pathRef.current, currentColor, STROKE_WIDTH);
        }

        // Reset current path
        pathRef.current = "";
        setCurrentPath("");
        isDrawingRef.current = false;
      }
    }
  };

  const clearCanvas = () => {
    console.log("Clearing SVG canvas");
    setPaths([]);
    setCurrentPath("");
    pathRef.current = "";
    isDrawingRef.current = false;
  };

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
  ];

  console.log("SVG Canvas - isDrawing:", isDrawing);
  console.log("SVG Canvas - paths count:", paths.length);
  if (paths.length > 0) {
    console.log("First SVG path:", paths[0].d.substring(0, 30) + "...");
  }

  return (
    <View style={styles.container}>
      <View style={styles.canvasContainer}>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onGestureStateChange}
          minDist={2}
          maxPointers={1}
        >
          <View style={styles.canvas}>
            <Svg width="100%" height="100%" style={styles.svg}>
              <G>
                {/* Add a background rect for touch debugging */}
                <Rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="white"
                  stroke="lightgray"
                  strokeWidth="1"
                />

                {paths.map((path) => (
                  <Path
                    key={path.key}
                    d={path.d}
                    stroke={path.stroke}
                    strokeWidth={path.strokeWidth}
                    fill="none"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ))}
                {currentPath ? (
                  <Path
                    d={currentPath}
                    stroke={currentColor}
                    strokeWidth={STROKE_WIDTH}
                    fill="none"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : null}
              </G>
            </Svg>
          </View>
        </PanGestureHandler>
      </View>

      <TouchableOpacity style={styles.debugButton} onPress={debugTouch}>
        <Text style={styles.debugButtonText}>Test Touch</Text>
      </TouchableOpacity>

      {isDrawing && (
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.clearButton} onPress={clearCanvas}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>

          <View style={styles.colorPicker}>
            {colors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  currentColor === color && styles.selectedColor,
                ]}
                onPress={() => setCurrentColor(color)}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  canvasContainer: {
    width: width,
    height: CANVAS_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DDDDDD",
  },
  canvas: {
    width: "100%",
    height: "100%",
  },
  svg: {
    backgroundColor: "#FFFFFF",
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  colorPicker: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#DDDDDD",
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: "#333333",
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FF3B30",
    borderRadius: 4,
  },
  clearButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  debugButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#34C759",
    borderRadius: 4,
    marginTop: 8,
  },
  debugButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export default FallbackCanvas;

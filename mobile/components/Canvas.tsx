import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from "react-native";
import { Canvas, Path } from "@shopify/react-native-skia";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import { SelectedTool } from "../types/canvas";

const { width } = Dimensions.get("window");
const CANVAS_HEIGHT = width * 0.8; // 4:3 aspect ratio
const STROKE_WIDTH = 4;

type DrawingCanvasProps = {
  isDrawing: boolean;
  onDrawingData?: (path: string, color: string, strokeWidth: number) => void;
};

type PathData = {
  path: string;
  color: string;
  strokeWidth: number;
};

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isDrawing,
  onDrawingData,
}) => {
  const [paths, setPaths] = useState<PathData[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [currentColor, setCurrentColor] = useState<string>("#000000");
  const [selectedTool, setSelectedTool] = useState<SelectedTool>(
    SelectedTool.Pencil
  );

  // Keep a ref for the current path to access in gesture handlers
  const currentPathRef = useRef<string>("");

  // Update the ref when the state changes
  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  const handleGesture = (event: PanGestureHandlerGestureEvent) => {
    if (!isDrawing) return;

    const { x, y } = event.nativeEvent;

    if (event.nativeEvent.state === 1) {
      // BEGIN
      const newPath = `M ${x} ${y}`;
      setCurrentPath(newPath);
      currentPathRef.current = newPath;
    } else if (event.nativeEvent.state === 2) {
      // ACTIVE
      const updatedPath = `${currentPathRef.current} L ${x} ${y}`;
      setCurrentPath(updatedPath);
      currentPathRef.current = updatedPath;

      // Create a temporary path for display
      const tempPaths = [...paths];
      // Remove the current path if it exists
      const existingPathIndex = tempPaths.findIndex(
        (p) => p.color === currentColor && p.strokeWidth === STROKE_WIDTH
      );
      if (existingPathIndex >= 0) {
        tempPaths.splice(existingPathIndex, 1);
      }

      // Add the updated path
      setPaths([
        ...tempPaths,
        {
          path: updatedPath,
          color: currentColor,
          strokeWidth: STROKE_WIDTH,
        },
      ]);
    } else if (event.nativeEvent.state === 5) {
      // END
      // Send the final path to the parent component
      if (onDrawingData && currentPathRef.current) {
        onDrawingData(currentPathRef.current, currentColor, STROKE_WIDTH);
      }

      // Reset current path
      setCurrentPath("");
    }
  };

  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath("");
    currentPathRef.current = "";
  };

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
  ];

  return (
    <View style={styles.container}>
      <View style={styles.canvasContainer}>
        <PanGestureHandler onGestureEvent={handleGesture} enabled={isDrawing}>
          <View style={styles.canvas}>
            <Canvas style={styles.canvas}>
              {paths.map((pathData, index) => (
                <Path
                  key={index}
                  path={pathData.path}
                  strokeWidth={pathData.strokeWidth}
                  style="stroke"
                  strokeJoin="round"
                  strokeCap="round"
                  color={pathData.color}
                />
              ))}
            </Canvas>
          </View>
        </PanGestureHandler>
      </View>

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
});

export default DrawingCanvas;

import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Pressable,
} from "react-native";
import { Canvas, Path, Group, Circle, Rect } from "@shopify/react-native-skia";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  TapGestureHandler,
  TapGestureHandlerGestureEvent,
  State,
} from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const CANVAS_HEIGHT = width * 0.8;
const STROKE_WIDTH = 8;
const DOT_RADIUS = 5;

// Define tool types
enum DrawingTool {
  Pencil = "pencil",
  Circle = "circle",
  Square = "square",
  Triangle = "triangle",
}

type DrawingCanvasProps = {
  isDrawing: boolean;
  width: number;
  height: number;
  onDrawingData?: (path: string, color: string, strokeWidth: number) => void;
};

const SkiaCanvas: React.FC<DrawingCanvasProps> = ({
  isDrawing,
  width,
  height,
  onDrawingData,
}) => {
  // Canvas state
  const [paths, setPaths] = useState<{ path: string; color: string }[]>([
    // Test shape
    { path: "M20,20 L220,20 L220,220 L20,220 Z", color: "red" },
  ]);
  const [currentColor, setCurrentColor] = useState("#FF0000");
  const [selectedTool, setSelectedTool] = useState<DrawingTool>(
    DrawingTool.Pencil
  );
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTH);

  // Path drawing state
  const [currentPath, setCurrentPath] = useState("");
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );

  // References for gesture handlers
  const panRef = useRef(null);
  const tapRef = useRef(null);

  // Handle single tap for dots - only triggered on release
  const onTapGesture = (event: TapGestureHandlerGestureEvent) => {
    try {
      if (event.nativeEvent.state === State.ACTIVE) {
        const { x, y } = event.nativeEvent;
        console.log("Tap at", x, y);

        if (selectedTool === DrawingTool.Pencil) {
          // Create a small circle path at tap point
          const dotPath = `M${x},${y} m-${DOT_RADIUS},0 a${DOT_RADIUS},${DOT_RADIUS} 0 1,0 ${
            DOT_RADIUS * 2
          },0 a${DOT_RADIUS},${DOT_RADIUS} 0 1,0 -${DOT_RADIUS * 2},0`;

          // Add dot to paths
          setPaths((prev) => [...prev, { path: dotPath, color: currentColor }]);

          // Send data to parent
          if (onDrawingData) {
            onDrawingData(dotPath, currentColor, strokeWidth);
          }
        }
      }
    } catch (error) {
      console.error("Error in tap gesture:", error);
    }
  };

  // Handle pan gestures for drawing
  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    try {
      const { x, y } = event.nativeEvent;

      // Start drawing on touch
      if (!isDrawingActive) {
        setIsDrawingActive(true);
        setStartPoint({ x, y });

        if (selectedTool === DrawingTool.Pencil) {
          setCurrentPath(`M${x},${y}`);
        }
      }
      // Continue drawing
      else {
        if (selectedTool === DrawingTool.Pencil) {
          // Free-hand drawing
          setCurrentPath((prevPath) => `${prevPath} L${x},${y}`);
        } else if (startPoint) {
          // Shape drawing - update shape based on current position
          if (selectedTool === DrawingTool.Square) {
            const squarePath = createRectPath(startPoint.x, startPoint.y, x, y);
            setCurrentPath(squarePath);
          } else if (selectedTool === DrawingTool.Circle) {
            const radius = Math.sqrt(
              Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
            );
            const circlePath = createCirclePath(
              startPoint.x,
              startPoint.y,
              radius
            );
            setCurrentPath(circlePath);
          } else if (selectedTool === DrawingTool.Triangle) {
            const trianglePath = createTrianglePath(
              startPoint.x,
              startPoint.y,
              x,
              y
            );
            setCurrentPath(trianglePath);
          }
        }
      }
    } catch (error) {
      console.error("Error in gesture event:", error);
    }
  };

  // Handle end of drawing
  const onGestureStateChange = (event: PanGestureHandlerGestureEvent) => {
    try {
      if (
        isDrawingActive &&
        event.nativeEvent.state === State.END &&
        currentPath
      ) {
        // Make sure we've moved enough for this to not be considered a tap
        const { x, y } = event.nativeEvent;
        if (
          startPoint &&
          (Math.abs(x - startPoint.x) > 5 || Math.abs(y - startPoint.y) > 5)
        ) {
          // Add to paths only at the end to avoid state updates during drawing
          setPaths((prev) => [
            ...prev,
            { path: currentPath, color: currentColor },
          ]);

          // Send data to parent
          if (onDrawingData) {
            onDrawingData(currentPath, currentColor, strokeWidth);
          }
        }

        // Reset state
        setCurrentPath("");
        setIsDrawingActive(false);
        setStartPoint(null);
      }
    } catch (error) {
      console.error("Error in gesture state change:", error);
    }
  };

  // Helper function to create rectangle path
  const createRectPath = (
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    return `M${startX},${startY} L${endX},${startY} L${endX},${endY} L${startX},${endY} Z`;
  };

  // Helper function to create circle path
  const createCirclePath = (
    centerX: number,
    centerY: number,
    radius: number
  ) => {
    return `M${centerX - radius},${centerY} a${radius},${radius} 0 1,0 ${
      radius * 2
    },0 a${radius},${radius} 0 1,0 -${radius * 2},0`;
  };

  // Helper function to create triangle path
  const createTrianglePath = (
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    const midX = startX + (endX - startX) / 2;
    return `M${midX},${startY} L${endX},${endY} L${startX},${endY} Z`;
  };

  // Clear canvas
  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath("");
  };

  // Colors for the color picker
  const colors = [
    "#000000", // Black
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FFA500", // Orange
  ];

  // Tool buttons
  const tools = [
    { id: DrawingTool.Pencil, icon: "pencil", label: "Pencil" },
    { id: DrawingTool.Circle, icon: "ellipse-outline", label: "Circle" },
    { id: DrawingTool.Square, icon: "square-outline", label: "Square" },
    { id: DrawingTool.Triangle, icon: "triangle-outline", label: "Triangle" },
  ];

  return (
    <View style={styles.container}>
      {/* Drawing area */}
      <View style={styles.canvasContainer}>
        <View style={styles.canvasWrapper}>
          <PanGestureHandler
            ref={panRef}
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onGestureStateChange}
            minDist={5} // Minimum distance to consider as a pan gesture
          >
            <View style={styles.canvasWrapper}>
              <TapGestureHandler
                ref={tapRef}
                onHandlerStateChange={onTapGesture}
                maxDist={5} // Maximum distance for a tap
                shouldCancelWhenOutside={true}
              >
                <View style={styles.canvasWrapper}>
                  <Canvas style={styles.canvas}>
                    <Group>
                      {/* Draw saved paths */}
                      {paths.map((path, i) => (
                        <Path
                          key={i}
                          path={path.path}
                          color={path.color}
                          style="stroke"
                          strokeWidth={strokeWidth}
                          strokeJoin="round"
                          strokeCap="round"
                        />
                      ))}

                      {/* Draw current path */}
                      {currentPath ? (
                        <Path
                          path={currentPath}
                          color={currentColor}
                          style="stroke"
                          strokeWidth={strokeWidth}
                          strokeJoin="round"
                          strokeCap="round"
                        />
                      ) : null}
                    </Group>
                  </Canvas>
                </View>
              </TapGestureHandler>
            </View>
          </PanGestureHandler>
        </View>
      </View>

      {/* Drawing tools */}
      <View style={styles.toolbarContainer}>
        {/* Tool selection */}
        <View style={styles.toolsRow}>
          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={[
                styles.toolButton,
                selectedTool === tool.id && styles.selectedTool,
              ]}
              onPress={() => setSelectedTool(tool.id)}
            >
              <Ionicons
                name={tool.icon as any}
                size={24}
                color={selectedTool === tool.id ? "#FFFFFF" : "#000000"}
              />
            </TouchableOpacity>
          ))}

          {/* Clear button (trash can) */}
          <TouchableOpacity style={styles.trashButton} onPress={clearCanvas}>
            <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Color selection */}
        <View style={styles.colorRow}>
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
    borderWidth: 3,
    borderColor: "#000000",
    marginBottom: 12,
  },
  canvasWrapper: {
    width: "100%",
    height: "100%",
  },
  canvas: {
    flex: 1,
    backgroundColor: "#F0F0F0",
  },
  toolbarContainer: {
    width: "100%",
    paddingHorizontal: 8,
  },
  toolsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  toolButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
    marginHorizontal: 4,
  },
  selectedTool: {
    backgroundColor: "#007AFF",
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#000000",
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: "#000000",
    transform: [{ scale: 1.1 }],
  },
  trashButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FF3B30",
    marginHorizontal: 4,
  },
  clearButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export default SkiaCanvas;

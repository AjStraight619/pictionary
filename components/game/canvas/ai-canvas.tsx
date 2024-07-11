'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as ms from '@magenta/sketch';
import { SketchRNN } from '@magenta/sketch';

const AICanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [model, setModel] = useState<SketchRNN | null>(null);

  useEffect(() => {
    // Load the SketchRNN model
    const loadModel = async () => {
      const sketchRNN = new ms.SketchRNN(
        'https://storage.googleapis.com/quickdraw-models/sketchRNN/large_models/cat.gen.json',
      );
      await sketchRNN.initialize();
      setModel(sketchRNN);
      console.log('Model loaded');
    };

    loadModel();
  }, []);

  useEffect(() => {
    if (model) {
      generateDrawing(model);
    }
  }, [model]);

  const generateDrawing = async (model: SketchRNN) => {
    const seed = model.zeroInput();
    let state = model.zeroState();
    const strokes = [];

    for (let i = 0; i < model.info.max_seq_len; i++) {
      const pdf = model.getPDF(state);
      const [dx, dy, pen_down, pen_up, pen_end] = model.sample(pdf);
      strokes.push([dx, dy, pen_down, pen_up, pen_end]);
      state = model.update([dx, dy, pen_down, pen_up, pen_end], state);
      if (pen_end === 1) break;
    }

    renderSketch(strokes);
  };

  const renderSketch = (sketch: number[][]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    let x = canvas.width / 2;
    let y = canvas.height / 2;
    sketch.forEach(([dx, dy, pen_down]) => {
      if (pen_down) {
        ctx.lineTo((x += dx), (y += dy));
        ctx.stroke();
      } else {
        ctx.moveTo((x += dx), (y += dy));
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <canvas ref={canvasRef} width={500} height={500} className="bg-white " />
    </div>
  );
};

export default AICanvas;

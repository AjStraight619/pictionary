import { fabric } from "fabric";

// Extending fabric object classes to include id's and initial positions

export class CustomCircle extends fabric.Circle {
  id?: string;
  initialLeft?: number;
  initialTop?: number;

  constructor(options?: fabric.ICircleOptions & { id?: string }) {
    super(options);
    if (options?.id) {
      this.id = options.id;
    }
  }

  toObject(propertiesToInclude: string[] = []) {
    return {
      ...super.toObject(propertiesToInclude),
      id: this.id,
    };
  }

  setInitialPosition() {
    this.initialLeft = this.left;
    this.initialTop = this.top;
  }
}

export class CustomRect extends fabric.Rect {
  id?: string;
  initialLeft?: number;
  initialTop?: number;

  constructor(options?: fabric.IRectOptions & { id?: string }) {
    super(options);
    if (options?.id) {
      this.id = options.id;
    }
  }

  toObject(propertiesToInclude: string[] = []) {
    return {
      ...super.toObject(propertiesToInclude),
      id: this.id,
    };
  }

  setInitialPosition() {
    this.initialLeft = this.left;
    this.initialTop = this.top;
  }
}

export class CustomTriangle extends fabric.Triangle {
  id?: string;
  initialLeft?: number;
  initialTop?: number;

  constructor(options?: fabric.ITriangleOptions & { id?: string }) {
    super(options);
    if (options?.id) {
      this.id = options.id;
    }
  }

  toObject(propertiesToInclude: string[] = []) {
    return {
      ...super.toObject(propertiesToInclude),
      id: this.id,
    };
  }

  setInitialPosition() {
    this.initialLeft = this.left;
    this.initialTop = this.top;
  }
}

export class CustomPath extends fabric.Path {
  id?: string;
  initialLeft?: number;
  initialTop?: number;

  constructor(
    path?: string | fabric.Point[],
    options?: fabric.IPathOptions & { id?: string }
  ) {
    super(path, options);
    if (options?.id) {
      this.id = options.id;
    }
  }

  toObject(propertiesToInclude: string[] = []) {
    return {
      ...super.toObject(propertiesToInclude),
      id: this.id,
    };
  }

  setInitialPosition() {
    this.initialLeft = this.left;
    this.initialTop = this.top;
  }
}

export type CustomFabricObjectShape =
  | CustomCircle
  | CustomRect
  | CustomTriangle
  | CustomPath;

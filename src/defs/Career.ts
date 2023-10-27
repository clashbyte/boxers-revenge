import { vec3 } from 'gl-matrix';

interface LightDef {
  position: vec3;
  color: vec3;
  range: number;
}

export interface CareerDef {
  location: number;
  opponent: number;

  locationPreview: string;
  locationName: string;

  novelFrames: string[];
  novelAudio: string;

  lights: LightDef[];
}

export const CAREER: CareerDef[] = [];

import { vec3 } from 'gl-matrix';

export const LOCATION_LIGHTS: { position: vec3; color: vec3; range: number }[][] = [
  // Prison cell
  [
    {
      position: [-5, 4, -5],
      color: [0.9, 1, 0.9],
      range: 15,
    },
    {
      position: [11.5, 4, 4],
      color: [1.0, 0.4, 0.4],
      range: 15,
    },
  ],

  // Jail outside
  [
    {
      position: [-4, 7.3, -9.6],
      range: 20,
      color: [1.3, 0.9, 0.5],
    },
    {
      position: [-15, 3, -25],
      range: 20,
      color: [0, 1, 1],
    },
    {
      position: [-15, 3, -5],
      range: 8,
      color: [1, 0.2, 0],
    },
  ],

  // Gas station
  [
    {
      position: [0, 6, -9],
      range: 20,
      color: [0.9, 0.9, 1.0],
    },
    {
      position: [-11.5, 3, 0],
      range: 8,
      color: [1.0, 1.0, 1.0],
    },
    {
      position: [4, 8, 5],
      range: 15,
      color: [1.0, 1.0, 0.7],
    },
  ],

  // Park
  [
    {
      position: [-0.2, 6, -7],
      range: 25,
      color: [1.1, 1.0, 0.7],
    },
  ],

  // Underground
  [
    {
      position: [3, 4.5, -2],
      range: 12,
      color: [1.1, 1.0, 0.7],
    },
    {
      position: [-14, 4.5, 2],
      range: 13,
      color: [0.3, 0.6, 1.0],
    },
  ],

  // Bus stop
  [
    {
      position: [-0.2, 6, -7],
      range: 15,
      color: [1.1, 1.0, 0.7],
    },
    {
      position: [16, 6, -5],
      range: 10,
      color: [1.1, 1.0, 0.7],
    },
  ],

  // Bar
  [
    {
      position: [7.7, 2.8, -9.5],
      range: 10,
      color: [1.1, 1.0, 0.8],
    },
    {
      position: [-7, 2.8, -11],
      range: 10,
      color: [1.1, 1.0, 0.8],
    },
    {
      position: [9, 6, 8],
      range: 35,
      color: [0.9, 0.7, 0.9],
    },
    {
      position: [-15, 4, 1],
      range: 10,
      color: [0.0, 1.0, 0.0],
    },
  ],
];

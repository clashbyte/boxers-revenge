import { vec3 } from 'gl-matrix';

export const LOCATION_POINTS: { point: vec3; target: vec3 }[][] = [
  // Jail
  [
    {
      point: [0.3, 0.7, 4],
      target: [0, 1, -1],
    },
    {
      point: [-9, 1, 0],
      target: [-7, 1.4, -4],
    },
    {
      point: [8, 3, 0],
      target: [7, 2.5, -1.5],
    },
    {
      point: [-12, 2, 0],
      target: [-13, 1, -0.6],
    },
    {
      point: [8, 3, 0],
      target: [9, 2.5, -1.5],
    },
  ],

  // Outside
  [
    {
      point: [0.3, 0.7, 4],
      target: [0, 1, -1],
    },
    {
      point: [8, 3, 0],
      target: [7, 2.5, -1.5],
    },
    {
      point: [-5, 1, 0],
      target: [-3, 1.4, -4],
    },
    {
      point: [0, 2, -2],
      target: [-3, 4, -6],
    },
    {
      point: [6, 3, 0],
      target: [7, 2.5, -1.5],
    },
  ],

  // Gas station
  [
    {
      point: [0.3, 0.7, 4],
      target: [0, 1, -1],
    },
    {
      point: [8, 1, 0],
      target: [6, 1.4, -4],
    },
    {
      point: [8, 3, 0],
      target: [7, 2.5, -1.5],
    },
    {
      point: [-8, 2, 1],
      target: [-12, 1, -0.6],
    },
    {
      point: [8, 3, 0],
      target: [9, 2.5, -1.5],
    },
  ],

  // Park
  [
    {
      point: [0.3, 0.7, 4],
      target: [0, 1, -1],
    },
    {
      point: [8, 1, 0],
      target: [6, 1.4, -4],
    },
    {
      point: [8, 3, 0],
      target: [7, 2.5, -1.5],
    },
    {
      point: [-8, 2, 1],
      target: [8, 1, -20],
    },
    {
      point: [8, 3, 0],
      target: [9, 2, -1.5],
    },
  ],

  // Underground
  [
    {
      point: [0.3, 0.7, 4],
      target: [0, 1, -1],
    },
    {
      point: [8, 1, 0],
      target: [6, 1.2, -2],
    },
    {
      point: [8, 3, 0],
      target: [7, 2.5, -1.5],
    },
    {
      point: [-8, 2, 1],
      target: [8, 1, -20],
    },
    {
      point: [8, 3, 0],
      target: [9, 2, -1.5],
    },
  ],

  // Bus stop
  [
    {
      point: [0.3, 0.7, 4],
      target: [0, 1, -1],
    },
    {
      point: [8, 1, 0],
      target: [6, 1.2, -2],
    },
    {
      point: [8, 3, 0],
      target: [7, 2.5, -1.5],
    },
    {
      point: [-8, 2, 1],
      target: [8, 1, -20],
    },
    {
      point: [8, 3, 0],
      target: [9, 2, -1.5],
    },
  ],

  // Bar
  [
    {
      point: [0.3, 0.7, 4],
      target: [0, 1, -1],
    },
    {
      point: [8, 1, 0],
      target: [6, 1.2, -2],
    },
    {
      point: [8, 3, 0],
      target: [7, 2.5, -1.5],
    },
    {
      point: [-8, 2, 1],
      target: [-10, 2.2, 0],
    },
    {
      point: [8, 3, 0],
      target: [9, 2.5, -1.5],
    },
  ],
];

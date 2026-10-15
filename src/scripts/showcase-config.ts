/** Path controls use the existing scene's world coordinates. +Y is up. */
export const showcaseConfig = {
 wheelPixelsPerCycle: 3200,
 dragPixelsPerCycle: 1400,
 initialProgress: .56,
 cyclePause: .12, // Hidden interval between offstage exit and the next entry.
 core: {x:0,z:0},
 orbitRadius: 5.05,
 orbitStartAngle: Math.PI*.75,
 modelHeight: .065,
 modelGapWorld: 8.0, // Arc separation on the circle; model podium diameter is about 2.74.
 phaseRatios: {entry:.24,orbit:.58,exit:.18},
 entry: {start:[-30.5,-4.7,-1.6] as const,mobileStart:[-11,-3,-2] as const,control:[-14,4.8,-20] as const,tangentLength:3},
 exit: {tangentLength:4,bendControl:[-7,2.4,0] as const,bendEnd:[-4,3,-8] as const,control:[15,4.8,-20] as const,end:[26,1.2,-40] as const},
 maxFeatured: 4,
 debugPath: false, // Development overlay; off by default, never a shipping guide image.
 camera: {
  desktop: {distance:19.8,height:8.4,azimuth:.72,target:[0,1.45,0] as const,fov:36},
  mobile: {distance:21,height:10,azimuth:.72,target:[0,1.5,0] as const,fov:44},
  mobileFitRadius:6.8,
 },
 quality: {desktopDpr:1.5,mobileDpr:1,bloomStrength:.18,mobileBloomStrength:.09,bloomRadius:.4,bloomThreshold:1.8},
} as const;

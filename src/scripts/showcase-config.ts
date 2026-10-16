/** Path controls use the existing scene's world coordinates. +Y is up. */
export const showcaseConfig = {
 wheelViewportHeightsPerCycle: 4, // One full route per four browser viewport heights of wheel input.
 dragStageWidthsPerCycle: 1, // One full route per one stage width of horizontal drag.
 initialProgress: .56,
 cyclePause: .12, // Hidden interval between offstage exit and the next entry.
 core: {x:.45,z:2.4},
 orbitCenter: {x:.27,z:-.1},
 orbitRadius: 3.75,
 orbitFrontRadius: 5, // The front arc clears the foreground core and stays on the stone deck.
 orbitStartAngle: Math.PI/2, // Shared arrival/departure point: rear centre of the deck.
 modelHeight: .15,
 modelPhaseGap: .5, // Opposite stations at rest; podium diameter is 2.32 world units.
 phaseRatios: {entry:.24,orbit:.58,exit:.18},
 entry: {start:[24,5,-18] as const,mobileStart:[12,5,-12] as const,control:[9,4,-12] as const,tangentLength:3},
 exit: {tangentLength:3,bendControl:[-7,2.4,-8] as const,bendEnd:[-9,4,-14] as const,control:[-18,6,-20] as const,end:[-26,7,-30] as const},
 maxFeatured: 4,
 debugPath: false, // Development overlay; off by default, never a shipping guide image.
 camera: {
  desktop: {distance:22,height:6.644,azimuth:0,target:[0,1.325,0] as const,fov:25.947},
  mobile: {distance:21,height:11,azimuth:0,target:[0,1.6,0] as const,fov:44},
  mobileFitRadius:6.8,
 },
 quality: {desktopDpr:2,mobileDpr:1.5,desktopSamples:4,mobileSamples:2,slowFrameMs:65,bloomStrength:.35,mobileBloomStrength:.18,bloomRadius:.4,bloomThreshold:1.1},
} as const;

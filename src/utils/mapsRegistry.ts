
// SVGs are preferred, but use PNG if SVG is missing or broken
import ascentMap from '../assets/maps/ascent.svg';
import bindMap from '../assets/maps/bind.svg';
import breezeMap from '../assets/maps/breeze.svg';
import corrodeMap from '../assets/maps/corrode.svg';
import fractureMap from '../assets/maps/fracture.svg';
import havenMap from '../assets/maps/haven.svg';
import iceboxMap from '../assets/maps/icebox.svg';
import lotusMap from '../assets/maps/lotus.svg';
import pearlMap from '../assets/maps/pearl.png';
import splitMap from '../assets/maps/split.svg';
import sunsetMap from '../assets/maps/sunset.svg';
import abyssMap from '../assets/maps/abyss.svg';

export interface MapConfig {
    src: string;
    scale: number;
}

export const MAP_CONFIGS: Record<string, MapConfig> = {
    ascent:   { src: ascentMap,   scale: 1 },
    bind:     { src: bindMap,     scale: 0.813 },
    breeze:   { src: breezeMap,   scale: 0.92 },
    fracture: { src: fractureMap, scale: 1.089 },
    haven:    { src: havenMap,    scale: 1.14 },
    icebox:   { src: iceboxMap,   scale: 1.093 },
    lotus:    { src: lotusMap,    scale: 1.075  },
    pearl:    { src: pearlMap,    scale: 0.96 },
    split:    { src: splitMap,    scale: 1.08 },
    sunset:   { src: sunsetMap,   scale: 1.02 },
    abyss:    { src: abyssMap,    scale: 0.97},
    corrode:  { src: corrodeMap,  scale: 0.88 },
};

export const AVAILABLE_MAPS = Object.keys(MAP_CONFIGS);
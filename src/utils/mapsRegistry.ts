// src/utils/mapsRegistry.ts

// Importation de toutes les images
import ascentMap from '../assets/maps/ascent.svg';
import bindMap from '../assets/maps/bind.svg';
import breezeMap from '../assets/maps/breeze.svg';
import corrodeMap from '../assets/maps/corrode.svg';
import fractureMap from '../assets/maps/fracture.svg';
import havenMap from '../assets/maps/haven.svg';
import iceboxMap from '../assets/maps/icebox.svg';
import lotusMap from '../assets/maps/lotus.svg';
import pearlMap from '../assets/maps/pearl.svg';
import splitMap from '../assets/maps/split.svg';
import sunsetMap from '../assets/maps/sunset.svg';
import abyssMap from '../assets/maps/abyss.svg';

// Définition du type pour l'objet Map
export const MAPS_REGISTRY: Record<string, string> = {
    ascent: ascentMap,
    bind: bindMap,
    breeze: breezeMap,
    corrode: corrodeMap,
    fracture: fractureMap,
    haven: havenMap,
    icebox: iceboxMap,
    lotus: lotusMap,
    pearl: pearlMap,
    split: splitMap,
    sunset: sunsetMap,
    abyss: abyssMap,
};

// Liste pour l'affichage dans le menu (Home)
export const AVAILABLE_MAPS = Object.keys(MAPS_REGISTRY);
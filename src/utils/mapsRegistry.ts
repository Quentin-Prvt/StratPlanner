// src/utils/mapsRegistry.ts

// Importation de toutes les images
import ascentMap from '../assets/maps/Ascent.svg';
import bindMap from '../assets/maps/Bind.svg';
import breezeMap from '../assets/maps/Breeze.svg';
import corrodeMap from '../assets/maps/Corrode.svg';
import fractureMap from '../assets/maps/Fracture.svg';
import havenMap from '../assets/maps/Haven.svg';
import iceboxMap from '../assets/maps/Icebox.svg';
import lotusMap from '../assets/maps/Lotus.svg';
import pearlMap from '../assets/maps/Pearl.svg';
import splitMap from '../assets/maps/Split.svg';
import sunsetMap from '../assets/maps/Sunset.svg';
import abyssMap from '../assets/maps/Abyss.svg';

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
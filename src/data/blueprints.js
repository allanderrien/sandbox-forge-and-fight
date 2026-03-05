export const BLUEPRINTS = {
  // ── One-handed (slotsRequired=1, minRound=1) ──────────────────────────────
  dague: {
    id: 'dague', name: 'Dague', emoji: '🔪', category: 'light',
    slotsRequired: 1, elementSlots: 1, basePower: 5, special: null,
    minRound: 1,
    description: 'Légère et précise. Puissante même avec un seul élément.',
    color: '#aab4c4', colorDark: '#5d6d7e',
  },
  gourdin: {
    id: 'gourdin', name: 'Gourdin', emoji: '🪵', category: 'light',
    slotsRequired: 1, elementSlots: 1, basePower: 4, special: 'carry_over_1',
    minRound: 1,
    description: 'Robuste — reporte +1 crédit au prochain round.',
    color: '#c8a05a', colorDark: '#7d5a2e',
  },
  epee_courte: {
    id: 'epee_courte', name: 'Épée courte', emoji: '⚔️', category: 'light',
    slotsRequired: 1, elementSlots: 2, basePower: 2, special: null,
    minRound: 1,
    description: 'Deux emplacements pour plus de synergie.',
    color: '#74d7f7', colorDark: '#2980b9',
  },
  hache: {
    id: 'hache', name: 'Hache', emoji: '🪓', category: 'light',
    slotsRequired: 1, elementSlots: 2, basePower: 3, special: 'fire_bonus',
    minRound: 1,
    description: '+2 si Feu 🔥 ou Foudre ⚡ est placé dans ce slot.',
    color: '#ff6b35', colorDark: '#c0392b',
  },
  lance: {
    id: 'lance', name: 'Lance', emoji: '🔱', category: 'light',
    slotsRequired: 1, elementSlots: 3, basePower: 1, special: 'diversity',
    minRound: 1,
    description: '+1 par type d\'élément unique dans ce slot.',
    color: '#7bc67e', colorDark: '#27ae60',
  },
  bouclier: {
    id: 'bouclier', name: 'Bouclier', emoji: '🛡️', category: 'light',
    slotsRequired: 1, elementSlots: 1, basePower: 4, special: 'bloodstone',
    minRound: 1,
    description: '+2 par PV perdu (max +6). La douleur forgea les meilleurs défenseurs.',
    color: '#aab4c4', colorDark: '#5d6d7e',
  },
  epee_longue: {
    id: 'epee_longue', name: 'Épée longue', emoji: '🗡️', category: 'light',
    slotsRequired: 1, elementSlots: 3, basePower: 2, special: null,
    minRound: 1,
    description: 'Trois emplacements. Force brute.',
    color: '#c3b1e1', colorDark: '#8e44ad',
  },

  // ── Heavy (slotsRequired=2, minRound=4) ──────────────────────────────────
  epee_deux_mains: {
    id: 'epee_deux_mains', name: 'Épée à deux mains', emoji: '⚔️', category: 'heavy',
    slotsRequired: 2, elementSlots: 3, basePower: 6, special: null,
    minRound: 4,
    description: 'Massive. Occupe les deux emplacements d\'arme.',
    color: '#aab4c4', colorDark: '#5d6d7e',
  },
  masse_guerre: {
    id: 'masse_guerre', name: 'Masse de guerre', emoji: '🔨', category: 'heavy',
    slotsRequired: 2, elementSlots: 2, basePower: 8, special: null,
    minRound: 4,
    description: 'Base élevée, peu d\'emplacements.',
    color: '#9e9e9e', colorDark: '#616161',
  },
  faux: {
    id: 'faux', name: 'Faux', emoji: '💀', category: 'heavy',
    slotsRequired: 2, elementSlots: 3, basePower: 5, special: 'recipe_bonus',
    minRound: 4,
    description: '+4 si une recette secrète est forgée ici.',
    color: '#7bc67e', colorDark: '#27ae60',
  },
  arc_guerre: {
    id: 'arc_guerre', name: 'Arc de guerre', emoji: '🏹', category: 'heavy',
    slotsRequired: 2, elementSlots: 2, basePower: 7, special: 'rune_bonus',
    minRound: 4,
    description: '+2 par Rune 🔮 appliquée dans ce slot.',
    color: '#b388ff', colorDark: '#6a1b9a',
  },

  // ── Artefacts (slotsRequired=1, elementSlots=0, minRound=7) ──────────────
  orbe_vengeance: {
    id: 'orbe_vengeance', name: 'Orbe de Vengeance', emoji: '🔮', category: 'artefact',
    slotsRequired: 1, elementSlots: 0, basePower: 0, special: 'vengeance',
    minRound: 7,
    description: '+5 si le dernier round a été perdu, sinon +2.',
    color: '#ff6b35', colorDark: '#c0392b',
  },
  grimoire: {
    id: 'grimoire', name: 'Grimoire', emoji: '📖', category: 'artefact',
    slotsRequired: 1, elementSlots: 0, basePower: 0, special: 'diversity_all',
    minRound: 7,
    description: '+1 par type d\'élément unique dans TOUTES les armes.',
    color: '#f7d716', colorDark: '#e67e22',
  },
  pierre_sang: {
    id: 'pierre_sang', name: 'Pierre de Sang', emoji: '💉', category: 'artefact',
    slotsRequired: 1, elementSlots: 0, basePower: 0, special: 'bloodstone',
    minRound: 7,
    description: '+2 par PV perdu (max +6).',
    color: '#e74c3c', colorDark: '#7b241c',
  },
  amulette_fortune: {
    id: 'amulette_fortune', name: 'Amulette de Fortune', emoji: '🍀', category: 'artefact',
    slotsRequired: 1, elementSlots: 0, basePower: 3, special: null,
    minRound: 7,
    description: 'Puissance fixe de 3. Simple mais fiable.',
    color: '#7bc67e', colorDark: '#27ae60',
  },
  talisman_acier: {
    id: 'talisman_acier', name: 'Talisman d\'Acier', emoji: '⚙️', category: 'artefact',
    slotsRequired: 1, elementSlots: 0, basePower: 0, special: 'steel_bonus',
    minRound: 7,
    description: '+2 par Acier ⚙️ ou Cristal 💎 dans toutes les armes.',
    color: '#aab4c4', colorDark: '#5d6d7e',
  },
}

export const LIGHT_BLUEPRINT_IDS = ['dague', 'gourdin', 'epee_courte', 'hache', 'lance', 'bouclier', 'epee_longue']
export const HEAVY_BLUEPRINT_IDS = ['epee_deux_mains', 'masse_guerre', 'faux', 'arc_guerre']
export const ARTEFACT_BLUEPRINT_IDS = ['orbe_vengeance', 'grimoire', 'pierre_sang', 'amulette_fortune', 'talisman_acier']

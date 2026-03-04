# Forge & Fight — CLAUDE.md

## Stack
- React 18 + Vite 6, CSS Modules, state local uniquement (useReducer)
- GitHub Pages : base `/sandbox-forge-and-fight/` dans `vite.config.js`
- Deploy : `npx gh-pages -d dist` (après `npm run build`)
- Repo : https://github.com/allanderrien/sandbox-forge-and-fight
- Live : https://derrien.github.io/sandbox-forge-and-fight/

## Structure src/
```
data/
  materials.js      — MATERIALS (wood, stone, fire, ice, steel, poison, crystal, lightning, rune)
  recipes.js        — SECRET_RECIPES (5 recettes secrètes, powerMultiplier ×2)
  blueprints.js     — BLUEPRINTS (15 blueprints : light, heavy, artefact)

utils/
  forgeEngine.js    — forgeSlot (blueprint system), forgeWeapon (legacy AI), getSynergyBonus, findSecretRecipe
  aiLogic.js        — aiForge : génère l'arme IA selon round/wins
  deckManager.js    — drawCards, drawBlueprints

hooks/
  useGameState.js   — useReducer, actions ci-dessous

components/
  StatusBar/        — HP, wins, crédits, phase
  Card/             — carte matériau (button)
  HandArea/         — main du joueur + DraggableCardWrapper (dnd-kit)
  ForgeArea/        — enclume (wraps WeaponSlotGrid)
  WeaponSlotGrid/   — grille weapon + artefact slots
  SlotPanel/        — un slot (droppable dnd-kit)
  BlueprintCard/    — carte blueprint (draggable dnd-kit)
  BlueprintPhase/   — phase choix blueprint
  CombatArena/      — affichage combat
  ResultOverlay/    — game over
```

## Flux de jeu
`menu → blueprint → draw → forge → combat → result → (round suivant)`

## Actions useGameState
| Action | Payload |
|--------|---------|
| START_GAME | — |
| START_ROUND | — |
| PLACE_BLUEPRINT | blueprintId, slotKey |
| CONFIRM_BLUEPRINTS | — |
| SELECT_SLOT | slotKey |
| APPLY_ELEMENT | cardIndex, slotKey? (optionnel pour DnD direct) |
| REMOVE_ELEMENT | slotKey, elementIndex |
| FORGE | — |
| RESOLVE_COMBAT | — |

## State shape clé
```js
{
  phase,              // 'menu'|'blueprint'|'draw'|'forge'|'combat'|'result'|'gameover'
  round, playerHP, playerWins, credits, carryOverCredits, pendingCarryOver,
  playerHand,         // [{ id, uid }]
  drawnBlueprints,    // blueprints proposés ce round
  blueprintPlacements,// 0-2
  weaponSlots,        // [{ key, blueprint, elements, power, breakdown }]
  artefactSlots,      // idem
  focusedSlotKey,     // slot actif en forge (null = aucun)
  playerTotalPower, playerWeapon, aiWeapon,
  roundResult,        // 'win'|'lose'|'tie'
  lastRoundResult,    // pour artefact vengeance
  gameResult,         // 'victory'|'defeat'|null
  newMaterialsUnlocked,
}
```

## Règles de jeu
- 5 cartes tirées, 3 crédits/round
- 2 blueprints proposés, max 2 placements
- Blueprints persistent entre rounds, éléments réinitialisés
- Slots : 1 weapon (rounds 1-3) → 2 slots (round 4+, ou 1 heavy) → +1 artefact (round 7+)
- Victoire : 10 wins | Défaite : HP ≤ 0 (4 HP max) | Nul : −0.5 HP
- playerTotalPower = somme des puissances de tous les slots forgés

## Mécaniques de forge
**Synergy bonus** (automatique, toutes armes) :
- Paire identique → +1
- Triplet identique → +3
- Trio diversifié (3 types différents) → +2

**Blueprint specials** :
| Special | Effet |
|---------|-------|
| fire_bonus | +2 si 🔥 ou ⚡ présent |
| diversity | +1 par type unique dans CE slot |
| carry_over_1 | +1 crédit reporté au round suivant |
| recipe_bonus | +4 si recette secrète forgée ici |
| rune_bonus | +2 par 🔮 dans ce slot |
| vengeance | +5 si dernier round perdu, sinon +2 |
| diversity_all | +1 par type unique dans TOUTES les armes |
| bloodstone | +2 par PV perdu (max +6) |
| steel_bonus | +2 par ⚙️ ou 💎 dans toutes les armes |

**Recettes secrètes** (power ×2) :
- fire+steel+fire → Épée de Lave
- ice+crystal+ice → Lame Éternelle
- lightning+steel+crystal → Tonneblade
- poison+crystal+poison → Venomblade
- lightning+stone+lightning → Marteau de Tempête

## Drag & Drop (@dnd-kit/core)
- `PointerSensor` avec `activationConstraint: { distance: 8 }` (clics normaux non déclenchés)
- `DndContext` dans `App.jsx` (séparé blueprint / forge)
- Draggable : `BlueprintCard` (`bp-{id}`), `DraggableCardWrapper` dans HandArea (`el-{uid}`)
- Droppable : `SlotPanel` (`drop-{key}`)
- **Important** : Card enveloppée dans `<div style={{ pointerEvents: 'none' }}>` pour que
  les pointer events atteignent le wrapper div dnd-kit même quand le bouton est disabled
- Clic conservé comme fallback (slot focus → clic carte)

## Bugs corrigés (historique)
- roundResult calculé dans CombatArena depuis les puissances (pas depuis l'état null)
- newMaterialsUnlocked : comparaison stricte `=== 4` ou `=== 7`
- Armes lourdes persistantes : détection `slotsRequired === 2` avant d'expandre les slots
- DnD pointer events : `pointer-events: none` sur l'inner div du Card

## Prochaines idées possibles
- Afficher le détail des synergy/special bonuses dans le SlotPanel pendant la forge
- Tutoriel / tooltips sur les mécaniques cachées
- Son / animations de forge

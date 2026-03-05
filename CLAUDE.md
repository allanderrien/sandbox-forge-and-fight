# Forge & Fight — CLAUDE.md

## Stack
- React 18 + Vite 6, CSS Modules, state local uniquement (useReducer)
- GitHub Pages : base `/sandbox-forge-and-fight/` dans `vite.config.js`
- Deploy : `npm run build && npx gh-pages -d dist`
- Repo : https://github.com/allanderrien/sandbox-forge-and-fight
- Live : https://derrien.github.io/sandbox-forge-and-fight/

## Structure src/
```
data/
  materials.js      — MATERIALS (wood, stone, fire, ice, steel, poison, crystal, lightning, rune)
  recipes.js        — SECRET_RECIPES (21 recettes : 5 premium + 9 tier-1 + 7 rune-sorts)
  blueprints.js     — BLUEPRINTS (15 blueprints : light, heavy, artefact)
  opponentNames.js  — generateOpponentName() : pool 20 noms × 30 compléments loufoques

utils/
  forgeEngine.js    — forgeSlot (blueprint system), forgeWeapon (legacy), getSynergyBonus, findSecretRecipe
                      forgeSlot retourne { power, breakdown, name, emoji, materials, isSecret, recipe, glowColor }
  aiLogic.js        — aiForge(round, wins, difficulty, playerHP, lastRoundResult)
                      3 modes : easy (3 cartes) / normal (4 cartes) / hard (5 cartes + scaling)
                      aiWeapon inclut { slots, materials } pour affichage combat
                      Filtre bp.category !== 'artefact' avant sélection blueprint IA
  deckManager.js    — drawCards(wins, count), drawBlueprints(round)

hooks/
  useGameState.js   — useReducer, actions ci-dessous

components/
  StatusBar/        — HP, wins, crédits, phase + bouton ≡ Menu
  Card/             — carte matériau (button)
  HandArea/         — main du joueur + DraggableCardWrapper (dnd-kit) + bouton re-roll (1🪙)
  ForgeArea/        — enclume (wraps WeaponSlotGrid)
  WeaponSlotGrid/   — grille weapon + artefact slots
  SlotPanel/        — un slot (droppable dnd-kit)
  BlueprintCard/    — carte blueprint (draggable dnd-kit)
  BlueprintPhase/   — phase choix blueprint (animation flip 0.7s par carte)
  CombatArena/      — affichage combat (chips joueur + chips IA + secret reveal)
  ResultOverlay/    — game over (boutons ← Menu + Rejouer)
```

## Flux de jeu
`menu → blueprint → draw → forge → combat → result → (round suivant)`

## Actions useGameState
| Action | Payload |
|--------|---------|
| START_GAME | difficulty ('easy'\|'normal'\|'hard') |
| START_ROUND | — |
| PLACE_BLUEPRINT | blueprintId, slotKey |
| CONFIRM_BLUEPRINTS | — |
| SELECT_SLOT | slotKey |
| APPLY_ELEMENT | cardIndex, slotKey? (optionnel pour DnD direct) |
| REMOVE_ELEMENT | slotKey, elementIndex |
| FORGE | — |
| RESOLVE_COMBAT | — |
| REROLL_HAND | — (coûte 1🪙, remplace toute la main) |
| GOTO_MENU | — (retour menu sans reset) |

## State shape clé
```js
{
  phase,              // 'menu'|'blueprint'|'draw'|'forge'|'combat'|'result'|'gameover'
  round, playerHP, playerWins, credits, carryOverCredits, pendingCarryOver,
  playerHand,         // [{ id, uid }]
  difficulty,         // 'easy'|'normal'|'hard' — conservé au rejouer
  opponentName,       // nom loufoque tiré au START_GAME, stable sur la partie
  drawnBlueprints,    // blueprints proposés ce round
  blueprintPlacements,// 0-2
  weaponSlots,        // [{ key, blueprint, elements, power, breakdown }]
  artefactSlots,      // idem
  focusedSlotKey,     // slot actif en forge (null = aucun)
  playerTotalPower, playerWeapon, aiWeapon,
  roundResult,        // 'win'|'lose'|'tie'
  lastRoundResult,    // pour artefact vengeance
  gameResult,         // 'victory'|'defeat'|null
  newMaterialsUnlocked, // true au round 4 et 7 (basé sur state.round, pas playerWins)
}
```

## Règles de jeu
- 5 cartes tirées, 3 crédits/round + re-roll main entière pour 1🪙
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

**Recettes secrètes** (powerMultiplier × selon recette) — 21 recettes :
- 5 premium (3 éléments rares, coût élevé)
- 9 tier-1 accessibles (bois + feu/glace/pierre, coût ≤ 3🪙)
- 7 sorts de rune (rune + élément + rune)

## IA — aiLogic.js
- `easy` : 3 cartes, niveaux internes 1-3 selon round, variance ±1
- `normal` : 4 cartes, meilleur blueprint par basePower, pickCardsForSpecial, dual-slot round 4+
- `hard` : 5 cartes, estimateValue (exploite specials + context), dual-slot, scaling +floor((round-1)/3)
- aiWeapon : `{ power, name, emoji, materials, isSecret, slots, breakdown, glowColor }`
- Filtre `bp.category !== 'artefact'` systématique avant toute sélection

## Phase combat — CombatArena
- Chips joueur : reveal puis score décalé (CHIP_INTERVAL=500ms, SCORE_DELAY=230ms)
- Chips IA : même séquence après reveal de la carte IA (step 1)
- Secret reveal joueur : setSecretRevealed après dernier chip scoré + SECRET_REVEAL_DELAY
- Secret reveal IA : aiSecretRevealed, même logique
- Clash (step 2) attend la fin des chips IA + reveal secret si applicable
- opponentName affiché au-dessus de la carte IA (teamName)

## Animations
- Retournement cartes : `perspective(700px) rotateY(-90→0deg)` sur wrapper div (pas sur la carte elle-même → pas de conflit hover)
  - Main : 0.52s, stagger 0.11s par carte
  - Blueprints : 0.7s, stagger 0.35s (plus lent = suspense)
- Bannière unlock : pop-in scale overshoot + conic-gradient rotatif (::before inset:-50%) + box-shadow pulsé
- Chips combat : chipPop 0.5s cubic-bezier overshoot

## Drag & Drop (@dnd-kit/core)
- `PointerSensor` avec `activationConstraint: { distance: 8 }` (clics normaux non déclenchés)
- `DndContext` dans `App.jsx` (séparé blueprint / forge)
- Draggable : `BlueprintCard` (`bp-{id}`), `DraggableCardWrapper` dans HandArea (`el-{uid}`)
- Droppable : `SlotPanel` (`drop-{key}`)
- Card enveloppée dans `<div style={{ pointerEvents: 'none' }}>` pour pointer events dnd-kit
- Clic conservé comme fallback (slot focus → clic carte)

## Bugs corrigés (historique)
- roundResult calculé dans CombatArena depuis les puissances (pas depuis l'état null)
- newMaterialsUnlocked : state.round === 4 || 7 (pas playerWins)
- Armes lourdes persistantes : détection slotsRequired === 2 avant expansion des slots
- DnD pointer events : pointer-events: none sur l'inner div du Card
- aiWeapon.slots manquant → emojis multi-armes IA n'affichaient pas
- aiWeapon.materials manquant → forgeSlot retourne materials mais mergeWeapons l'écrasait
- IA utilisait artefacts comme armes : filtre category !== 'artefact'
- aiSecretRevealed manquant dans la réécriture CombatArena
- Bannière unlock déclenchée sur playerWins au lieu de round
- materialsList sans flex-wrap → emojis clippés sur armes dual-slot
- Difficulté IA remise à 'easy' au rejouer : onRestart(difficulty) dans ResultOverlay

## Prochaines idées possibles
- Tutoriel / tooltips sur les mécaniques cachées
- Son / animations de forge
- Afficher détail synergy/special dans SlotPanel pendant la forge

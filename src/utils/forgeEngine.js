import { MATERIALS } from '../data/materials.js'
import { SECRET_RECIPES } from '../data/recipes.js'

export const WEAPON_NAMES = {
  1: ['Bâton', 'Gourdin', 'Dague'],
  2: ['Épée courte', 'Hache', 'Lance'],
  3: ['Épée longue', 'Masse d\'armes', 'Fléau'],
  4: ['Épée à deux mains', 'Hache de guerre', 'Trident'],
}

export function getWeaponNamesForPower(power) {
  const tier = power <= 3 ? 1 : power <= 6 ? 2 : power <= 10 ? 3 : 4
  return WEAPON_NAMES[tier]
}

function getWeaponName(totalPower) {
  const tier = totalPower <= 3 ? 1 : totalPower <= 6 ? 2 : totalPower <= 10 ? 3 : 4
  const names = WEAPON_NAMES[tier]
  return names[Math.floor(Math.random() * names.length)]
}

function getSynergyBonus(materials) {
  if (materials.length < 2) return 0

  const ids = materials.map(m => m.id)
  const uniqueIds = new Set(ids)

  // Triplet identique
  if (materials.length === 3 && uniqueIds.size === 1) return 3

  // Paire identique
  const counts = {}
  for (const id of ids) counts[id] = (counts[id] || 0) + 1
  if (Object.values(counts).some(c => c >= 2)) return 1

  // Tous différents avec 3 matériaux
  if (materials.length === 3 && uniqueIds.size === 3) return 2

  return 0
}

export function findSecretRecipe(materials) {
  if (materials.length !== 3) return null

  const ids = materials.map(m => m.id)
  return SECRET_RECIPES.find(recipe =>
    recipe.ingredients.every((ing, i) => ing === ids[i])
  ) || null
}

// ── Blueprint-based forge (new system) ────────────────────────────────────

const MAX_HP = 4

function computeSpecialBonus(blueprint, elements, context) {
  const { special } = blueprint
  if (!special) return 0

  const { lastRoundResult, playerHP, allElements = [] } = context

  switch (special) {
    case 'carry_over_1':
      return 0  // handled at round end, not a power bonus

    case 'fire_bonus':
      return elements.some(c => c.id === 'fire' || c.id === 'lightning') ? 2 : 0

    case 'diversity':
      return new Set(elements.map(c => c.id)).size

    case 'recipe_bonus':
      return 0  // handled in secret recipe path of forgeSlot

    case 'rune_bonus':
      return elements.filter(c => c.id === 'rune').length * 2

    case 'vengeance':
      return lastRoundResult === 'lose' ? 5 : 2

    case 'diversity_all':
      return new Set(allElements.map(c => c.id)).size

    case 'bloodstone':
      return Math.min(6, (MAX_HP - (playerHP ?? MAX_HP)) * 2)

    case 'steel_bonus':
      return allElements.filter(c => c.id === 'steel' || c.id === 'crystal').length * 2

    default:
      return 0
  }
}

export function forgeSlot(blueprint, elements, context = {}) {
  if (!blueprint) return { power: 0, breakdown: null, name: null, emoji: null, materials: [], isSecret: false, recipe: null, glowColor: null }

  const elementSum = elements.reduce((sum, c) => sum + MATERIALS[c.id].power, 0)

  // Secret recipe only possible if blueprint has exactly 3 element slots
  const secretRecipe = blueprint.elementSlots === 3 && elements.length === 3
    ? findSecretRecipe(elements)
    : null

  let power, breakdown

  if (secretRecipe) {
    const multiplied = elementSum * secretRecipe.powerMultiplier
    const recipeExtra = blueprint.special === 'recipe_bonus' ? 4 : 0
    power = blueprint.basePower + multiplied + recipeExtra
    breakdown = {
      base: blueprint.basePower,
      elementSum,
      multiplier: secretRecipe.powerMultiplier,
      specialBonus: recipeExtra,
      secretRecipe,
      total: power,
    }
    return {
      power: Math.max(0, power),
      breakdown,
      name: secretRecipe.name,
      emoji: secretRecipe.weaponEmoji,
      materials: elements.map(c => c.id),
      isSecret: true,
      recipe: secretRecipe,
      glowColor: secretRecipe.glowColor,
    }
  }

  const synergyBonus = blueprint.elementSlots > 0 ? getSynergyBonus(elements) : 0
  const specialBonus = computeSpecialBonus(blueprint, elements, context)
  power = blueprint.basePower + elementSum + synergyBonus + specialBonus
  breakdown = {
    base: blueprint.basePower,
    elementSum,
    synergyBonus,
    specialBonus,
    total: power,
  }

  return {
    power: Math.max(0, power),
    breakdown,
    name: blueprint.name,
    emoji: blueprint.emoji,
    materials: elements.map(c => c.id),
    isSecret: false,
    recipe: null,
    glowColor: null,
  }
}

// ── Legacy weapon forge (used by AI) ──────────────────────────────────────

export function forgeWeapon(materials) {
  if (materials.length === 0) return null

  const basePower = materials.reduce((sum, m) => sum + MATERIALS[m.id].power, 0)
  const secretRecipe = findSecretRecipe(materials)

  if (secretRecipe) {
    return {
      name: secretRecipe.name,
      power: basePower * secretRecipe.powerMultiplier,
      materials: materials.map(m => m.id),
      isSecret: true,
      recipe: secretRecipe,
      emoji: secretRecipe.weaponEmoji,
      glowColor: secretRecipe.glowColor,
    }
  }

  const synergyBonus = getSynergyBonus(materials)
  const totalPower = basePower + synergyBonus

  return {
    name: getWeaponName(totalPower),
    power: totalPower,
    materials: materials.map(m => m.id),
    isSecret: false,
    synergyBonus,
    emoji: '⚔️',
    glowColor: null,
  }
}

import { MATERIALS } from '../data/materials.js'
import { SECRET_RECIPES } from '../data/recipes.js'

const WEAPON_NAMES = {
  1: ['Bâton', 'Gourdin', 'Dague'],
  2: ['Épée courte', 'Hache', 'Lance'],
  3: ['Épée longue', 'Masse d\'armes', 'Fléau'],
  4: ['Épée à deux mains', 'Hache de guerre', 'Trident'],
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

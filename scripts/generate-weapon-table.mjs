import { MATERIALS } from '../src/data/materials.js'
import { SECRET_RECIPES } from '../src/data/recipes.js'
import { forgeWeapon, findSecretRecipe, getWeaponNamesForPower } from '../src/utils/forgeEngine.js'
import { writeFileSync } from 'fs'
import { mkdirSync } from 'fs'
import xlsx from 'xlsx'

// ── Helpers ────────────────────────────────────────────────────────────────

function getPermutations(arr) {
  if (arr.length <= 1) return [arr]
  const seen = new Set()
  const result = []
  for (let i = 0; i < arr.length; i++) {
    if (seen.has(arr[i])) continue
    seen.add(arr[i])
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]
    for (const perm of getPermutations(rest)) {
      result.push([arr[i], ...perm])
    }
  }
  return result
}

function combosWithRepetition(pool, size) {
  const results = []
  function helper(start, current) {
    if (current.length === size) { results.push([...current]); return }
    for (let i = start; i < pool.length; i++) {
      current.push(pool[i])
      helper(i, current)
      current.pop()
    }
  }
  helper(0, [])
  return results
}

function checkSecret(combo) {
  for (const perm of getPermutations(combo)) {
    const recipe = findSecretRecipe(perm.map(id => ({ id })))
    if (recipe) return { recipe, order: perm }
  }
  return null
}

function label(id) {
  const m = MATERIALS[id]
  return `${m.emoji} ${m.name}`
}

function weaponTierName(power) {
  if (power <= 3) return 'Médiocre'
  if (power <= 6) return 'Commun'
  if (power <= 10) return 'Rare'
  return 'Légendaire'
}

function weaponNamesStr(power) {
  return getWeaponNamesForPower(power).join(' / ')
}

// ── Sheet 1 : Matériaux ────────────────────────────────────────────────────

const matRows = [
  ['Matériau', 'Puissance', 'Coût (⚗)', 'Disponibilité', 'Effet spécial', 'Tier'],
]
for (const [id, m] of Object.entries(MATERIALS)) {
  matRows.push([
    `${m.emoji} ${m.name}`,
    m.power,
    m.creditCost ?? 1,
    m.tier === 1 ? 'Dès le début' : 'Débloqué à 4 victoires',
    m.carryOver ? `+${m.carryOver} crédit reporté au round suivant` : '',
    m.tier,
  ])
}

// ── Sheet 2 : 1 carte ─────────────────────────────────────────────────────

const headers1 = ['Carte', 'Coût (⚗)', 'Puissance', 'Noms possibles', 'Tier arme']
const rows1 = [headers1]

for (const id of Object.keys(MATERIALS)) {
  const m = MATERIALS[id]
  const weapon = forgeWeapon([{ id }])
  rows1.push([label(id), m.creditCost ?? 1, weapon.power, weaponNamesStr(weapon.power), weaponTierName(weapon.power)])
}

// ── Sheet 3 : 2 cartes ────────────────────────────────────────────────────

const headers2 = ['Carte 1', 'Carte 2', 'Coût total (⚗)', 'Puissance base', 'Bonus synergie', 'Puissance finale', 'Noms possibles', 'Tier arme']
const rows2 = [headers2]

for (const combo of combosWithRepetition(Object.keys(MATERIALS), 2)) {
  const cards = combo.map(id => ({ id }))
  const weapon = forgeWeapon(cards)
  const cost = combo.reduce((s, id) => s + (MATERIALS[id].creditCost ?? 1), 0)
  const base = combo.reduce((s, id) => s + MATERIALS[id].power, 0)
  rows2.push([
    label(combo[0]), label(combo[1]),
    cost, base, weapon.synergyBonus ?? 0, weapon.power,
    weaponNamesStr(weapon.power),
    weaponTierName(weapon.power),
  ])
}

// ── Sheet 4 : 3 cartes ────────────────────────────────────────────────────

const headers3 = [
  'Carte 1', 'Carte 2', 'Carte 3',
  'Coût total (⚗)', 'Puissance base', 'Bonus synergie', 'Puissance normale',
  'Noms possibles (normal)', 'Recette secrète', 'Ordre requis', 'Puissance secrète',
]
const rows3 = [headers3]

for (const combo of combosWithRepetition(Object.keys(MATERIALS), 3)) {
  const cards = combo.map(id => ({ id }))
  const weapon = forgeWeapon(cards)
  const cost = combo.reduce((s, id) => s + (MATERIALS[id].creditCost ?? 1), 0)
  const base = combo.reduce((s, id) => s + MATERIALS[id].power, 0)
  const secret = checkSecret(combo)

  rows3.push([
    label(combo[0]), label(combo[1]), label(combo[2]),
    cost, base, weapon.synergyBonus ?? 0, weapon.power,
    weaponNamesStr(weapon.power),
    secret ? secret.recipe.name : '',
    secret ? secret.order.map(id => MATERIALS[id].name).join(' → ') : '',
    secret ? base * secret.recipe.powerMultiplier : '',
  ])
}

// ── Sheet 5 : Recettes secrètes ───────────────────────────────────────────

const secretRows = [
  ['Nom', 'Ingrédient 1', 'Ingrédient 2', 'Ingrédient 3', 'Coût total (⚗)', 'Puissance base', 'Puissance finale (×2)', 'Description'],
]
for (const recipe of SECRET_RECIPES) {
  const ids = recipe.ingredients
  const cost = ids.reduce((s, id) => s + (MATERIALS[id].creditCost ?? 1), 0)
  const base = ids.reduce((s, id) => s + MATERIALS[id].power, 0)
  secretRows.push([
    `${recipe.weaponEmoji} ${recipe.name}`,
    label(ids[0]), label(ids[1]), label(ids[2]),
    cost, base, base * recipe.powerMultiplier,
    recipe.description,
  ])
}

// ── Génération du workbook ────────────────────────────────────────────────

const wb = xlsx.utils.book_new()

function addSheet(name, data) {
  const ws = xlsx.utils.aoa_to_sheet(data)

  // Auto-width approx
  const colWidths = data[0].map((_, ci) =>
    Math.min(40, Math.max(10, ...data.map(row => String(row[ci] ?? '').length)))
  )
  ws['!cols'] = colWidths.map(w => ({ wch: w }))

  xlsx.utils.book_append_sheet(wb, ws, name)
}

addSheet('Matériaux', matRows)
addSheet('1 carte', rows1)
addSheet('2 cartes', rows2)
addSheet('3 cartes', rows3)
addSheet('Recettes secrètes', secretRows)

const outPath = 'forge-weapon-table.xlsx'
xlsx.writeFile(wb, outPath)

console.log(`✓ ${outPath} généré`)
console.log(`  · ${rows1.length - 1} combinaisons à 1 carte`)
console.log(`  · ${rows2.length - 1} combinaisons à 2 cartes`)
console.log(`  · ${rows3.length - 1} combinaisons à 3 cartes`)
console.log(`  · ${secretRows.length - 1} recettes secrètes`)

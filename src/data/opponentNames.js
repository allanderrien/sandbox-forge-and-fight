const NOUNS = [
  'Les adorateurs', 'Les chevaliers', 'Les disciples', 'Les gardiens',
  'Les seigneurs', 'Les maîtres', 'Les prophètes', 'Les apôtres',
  'Les hérauts', 'Les moines', 'Les collectionneurs', 'Les défenseurs',
  'Les croisés', 'Les bergers', 'Les ambassadeurs', 'Les monarques',
  'Les pèlerins', 'Les bâtisseurs', 'Les arpenteurs', 'Les archivistes',
]

const COMPLEMENTS = [
  'du parmesan', 'du lundi matin', 'de la carotte râpée', 'du slip en velours',
  'de la brique moisie', 'du yak tibétain', 'du fromage qui pue', 'de la chaussette trouée',
  'du radis noir', 'du tournevis rouillé', 'du cornichon géant', 'de la sardine fumée',
  'du plateau-repas', 'de la serpillière mouillée', 'du glaçon à la menthe',
  'de la quiche lorraine', 'du savon parfumé', 'de la boîte de petits pois',
  'du stylo BIC vide', 'du camembert chaud', 'de l\'aspirateur cassé',
  'du slip de bain fleuri', 'du marteau pneumatique', 'de la baguette ramollie',
  'du chou-fleur bouilli', 'de la mousse à raser', 'du dentifrice au bacon',
  'de la chaise bancale', 'de l\'ananas en boîte', 'du tricot humide',
]

export function generateOpponentName() {
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const comp = COMPLEMENTS[Math.floor(Math.random() * COMPLEMENTS.length)]
  return `${noun} ${comp}`
}

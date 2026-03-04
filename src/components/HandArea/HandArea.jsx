import { MATERIALS } from '../../data/materials.js'
import Card from '../Card/Card.jsx'
import styles from './HandArea.module.css'

export default function HandArea({ hand, onCardClick, disabled, credits }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Main ({hand.length} cartes)</h2>
      <div className={styles.hand}>
        {hand.map((card, index) => {
          const cost = MATERIALS[card.id].creditCost ?? 1
          const tooExpensive = credits < cost
          return (
            <div key={card.uid} className={styles.cardWrapper} style={{ '--i': index }}>
              <Card
                cardId={card.id}
                onClick={() => onCardClick(index)}
                disabled={disabled}
                tooExpensive={!disabled && tooExpensive}
              />
            </div>
          )
        })}
        {hand.length === 0 && (
          <p className={styles.empty}>Tous les matériaux sont à la forge</p>
        )}
      </div>
    </section>
  )
}

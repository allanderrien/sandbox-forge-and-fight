import Card from '../Card/Card.jsx'
import styles from './HandArea.module.css'

export default function HandArea({ hand, onCardClick, disabled, credits }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Main du joueur</h2>
      <div className={styles.hand}>
        {hand.map((card, index) => (
          <div key={card.uid} className={styles.cardWrapper}>
            <Card
              cardId={card.id}
              onClick={() => onCardClick(index)}
              disabled={disabled || credits <= 0}
            />
          </div>
        ))}
        {hand.length === 0 && (
          <p className={styles.empty}>Tous les matériaux sont à la forge</p>
        )}
      </div>
      {credits <= 0 && hand.length > 0 && (
        <p className={styles.hint}>Plus de crédits — forgez votre arme !</p>
      )}
    </section>
  )
}

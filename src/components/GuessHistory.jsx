export default function GuessHistory({ guesses, maxAttempts, answer }) {
  const slots = [];

  for (let i = 0; i < maxAttempts; i++) {
    const guess = guesses[i];
    const isFilled = guess !== undefined;
    const isSkip = isFilled && guess === '';
    const isCorrect = isFilled && !isSkip && guess.toLowerCase() === answer.toLowerCase();
    const isWrong = isFilled && !isSkip && !isCorrect;
    const isActive = !isFilled && i === guesses.length; // current slot

    let cls = 'guess-slot';
    if (isCorrect) cls += ' correct';
    else if (isWrong) cls += ' wrong';
    else if (isSkip) cls += ' skipped';
    else if (isActive) cls += ' active';
    else cls += ' empty';

    slots.push(
      <div key={i} className={cls}>
        {isSkip ? 'Skipped' : (isFilled ? guess : '')}
      </div>
    );
  }

  return <div className="guess-tracker">{slots}</div>;
}

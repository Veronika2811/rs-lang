const playSoundsAfterAnswer = (url:string) => {
  const audio = new Audio(url);
  audio.play();
};

export default playSoundsAfterAnswer;

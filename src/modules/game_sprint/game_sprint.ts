/* eslint-disable import/no-mutable-exports, no-await-in-loop */
import createDomNode from '../../utils/createDomNode';
import preload from '../game-audio-call/preload';
import './game_sprint.scss';
import renderSprintResults from './results/sprint_results';
import timer from './timer';
import App from '../../components/app';
import Statistics from '../statistics/statistics';
import playSoundsAfterAnswer from '../game-audio-call/play-sounds-after-answer';

interface IData {
  id: string,
  group: 0,
  page: 0,
  word: string,
  image: string,
  audio: string,
  audioMeaning: string,
  audioExample: string,
  textMeaning: string,
  textExample: string,
  transcription: string,
  wordTranslate: string,
  textMeaningTranslate: string,
  textExampleTranslate: string
}

const renderSprintGame = () => {
  const root = document.querySelector('#root') as HTMLElement;

  const sprintPage = createDomNode('section', ['sprint-game'], root);
  const sprintContainer = createDomNode('div', ['wrapper', 'sprint-game-wrapper'], sprintPage);

  const sprintHeader = createDomNode('div', ['sprint-header'], sprintContainer);
  createDomNode('p', ['sprint-english-word'], sprintContainer, '');
  createDomNode('p', ['sprint-russian-word'], sprintContainer, '');
  createDomNode('img', ['sprint-answer-icon'], sprintContainer);
  const sprintButtons = createDomNode('div', ['sprint-buttons'], sprintContainer);

  createDomNode('div', ['sprint-timer'], sprintHeader, '60');
  createDomNode('img', ['sprint-sound-icon'], sprintHeader, '', [{ src: './assets/svg/icons/game/voice.svg' }, { alt: 'Sprint sound icon' }]);
  createDomNode('div', ['sprint-counter'], sprintHeader, '0');

  createDomNode('button', ['btn', 'btn_red', 'wrong__button'], sprintButtons, 'Не верно');
  createDomNode('button', ['btn', 'btn_green', 'correct__button'], sprintButtons, 'Верно');
};

const arrayGenerator = (arrayEng: Array<string>, arrayRus: Array<string>) => {
  const result: Array<string> = [];
  arrayEng.forEach((item, idx) => {
    const bool: number = Math.floor(Math.random() * 2);
    const index: number = Math.floor(Math.random() * arrayEng.length);
    bool ? result.push(arrayRus[idx]) : result.push(arrayRus[index]);
  });
  return result;
};

const wordsCheck = (array: Array<string>, translation: Array<string>) => {
  const result: Array<boolean> = [];
  array.forEach((item, idx) => {
    item === translation[idx] ? result.push(true) : result.push(false);
  });
  return result;
};

let counter = 0;

const getWords = async () => {
  const words: Array<string> = [];
  const wordsTranslate: Array<string> = [];
  const pathAudio: Array<string> = [];
  const wordsId: Array<string> = [];
  const hash: Array<string> = window.location.href.split('/').reverse();
  const difficulty: number = hash.length > 7 ? Number(hash[1]) - 1 : Number(hash[0]) - 1;
  const chapterNumber: number = Number(sessionStorage.getItem('chapter-number')) - 1;
  const pageNumber: number = Number(sessionStorage.getItem('page-number')) - 1;

  if (difficulty <= 5) {
    for (let i = 0; i <= 30; i += 1) {
      const result = await fetch(`https://base-rs-lang-1.herokuapp.com/words?group=${difficulty}&page=${i}`);
      const data: Array<IData> = await result.json();
      data.forEach((item) => {
        pathAudio.push(item.audio);
        words.push(item.word);
        wordsTranslate.push(item.wordTranslate);
        wordsId.push(item.id);
      });
    }
  } else if (difficulty === 6) {
    const filter = '?filter={"userWord.difficulty":"hard"}';
    const result = await new App().getUserAggregateWords(filter);
    const data: Array<IData> = result[0].paginatedResults;
    data.forEach((item) => {
      pathAudio.push(item.audio);
      words.push(item.word);
      wordsTranslate.push(item.wordTranslate);
      wordsId.push(item.id);
    });
  } else {
    for (let i = pageNumber; i >= 0; i -= 1) {
      const result = await fetch(`https://base-rs-lang-1.herokuapp.com/words?group=${chapterNumber}&page=${i}`);
      const data: Array<IData> = await result.json();
      data.forEach((item) => {
        pathAudio.push(item.audio);
        words.push(item.word);
        wordsTranslate.push(item.wordTranslate);
        wordsId.push(item.id);
      });
    }
  }

  const englishWord = document.querySelector('.sprint-english-word') as HTMLElement;
  const russianWord = document.querySelector('.sprint-russian-word') as HTMLElement;
  const correctButton = document.querySelector('.correct__button') as HTMLElement;
  const wrongButton = document.querySelector('.wrong__button') as HTMLElement;
  const icon = document.querySelector('.sprint-answer-icon') as HTMLElement;

  const translation: Array<string> = arrayGenerator(words, wordsTranslate);

  // eslint-disable-next-line prefer-destructuring
  englishWord.innerText = words[0];
  // eslint-disable-next-line prefer-destructuring
  russianWord.innerText = translation[0];

  const changeWords = () => {
    counter += 1;
    englishWord.innerText = words[counter];
    russianWord.innerText = translation[counter];
    icon.classList.add('animated');
    setTimeout(() => {
      icon.classList.remove('animated');
    }, 700);
    if (words[counter] === undefined || translation[counter] === undefined) {
      try {
        const counter = document.querySelector('.sprint-counter') as HTMLElement;
        const score = Number(counter.innerText);
        renderSprintResults(score);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('error');
      }
    }
  };

  const answers = wordsCheck(wordsTranslate, translation);

  correctButton.addEventListener('click', changeWords);
  wrongButton.addEventListener('click', changeWords);

  const keyboardEvents = (e: KeyboardEvent) => {
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
      changeWords();
    }
  };

  const removeKeyboardEvents = () => {
    document.removeEventListener('keydown', keyboardEvents);
  };

  window.addEventListener('hashchange', removeKeyboardEvents);
  document.addEventListener('keydown', keyboardEvents);

  return [words, wordsTranslate, answers, pathAudio, wordsId];
};

export let englishWords: Array<string> = [];
export let russianWords: Array<string> = [];
export let result: Array<boolean> = [];
export let audioPaths: Array<string> = [];
const wordsId: Array<string> = [];
export const stats = new Statistics('sprint');

const play = (path: string) => {
  const url = 'https://base-rs-lang-1.herokuapp.com/';
  const audio = new Audio(`${url}${path}`);
  audio.play();
};

const userResponse = async () => {
  counter = 0;
  englishWords = [];
  russianWords = [];
  result = [];
  audioPaths = [];
  const prel = preload();
  const answers = await getWords();
  const correctButton = document.querySelector('.correct__button') as HTMLElement;
  const wrongButton = document.querySelector('.wrong__button') as HTMLElement;
  const soundIcon = document.querySelector('.sprint-sound-icon') as HTMLElement;
  const score = document.querySelector('.sprint-counter') as HTMLElement;
  const answerResult = document.querySelector('.sprint-answer-icon') as HTMLImageElement;

  answers[0].forEach((word) => {
    if (typeof word === 'string') {
      englishWords.push(word);
    }
  });

  answers[1].forEach((word) => {
    if (typeof word === 'string') {
      russianWords.push(word);
    }
  });

  answers[3].forEach((path) => {
    if (typeof path === 'string') {
      audioPaths.push(path);
    }
  });

  answers[4].forEach((id) => {
    if (typeof id === 'string') {
      wordsId.push(id);
    }
  });

  correctButton.addEventListener('click', () => {
    if (answers[2][counter - 1]) {
      let currentScore = Number(score.innerText);
      score.innerText = (currentScore += 10).toString();
      playSoundsAfterAnswer('./sounds-game-audio-call/correct-answer-sound-3.mp3');
      answerResult.src = './assets/svg/icons/green-bird.svg';
      result.push(true);
      stats.wordCorrectAnswer(wordsId[counter - 1]);
    } else {
      playSoundsAfterAnswer('./sounds-game-audio-call/incorrect-answer-sound-3.mp3');
      answerResult.src = './assets/svg/icons/game/cross.svg';
      result.push(false);
      stats.wordUncorrectAnswer(wordsId[counter - 1]);
    }
  });

  wrongButton.addEventListener('click', () => {
    if (answers[2][counter - 1]) {
      playSoundsAfterAnswer('./sounds-game-audio-call/incorrect-answer-sound-3.mp3');
      answerResult.src = './assets/svg/icons/game/cross.svg';
      result.push(false);
      stats.wordUncorrectAnswer(wordsId[counter - 1]);
    } else {
      let currentScore = Number(score.innerText);
      score.innerText = (currentScore += 10).toString();
      playSoundsAfterAnswer('./sounds-game-audio-call/correct-answer-sound-3.mp3');
      answerResult.src = './assets/svg/icons/green-bird.svg';
      result.push(true);
      stats.wordCorrectAnswer(wordsId[counter - 1]);
    }
  });

  const keyboardEvents = (e: KeyboardEvent) => {
    if (e.code === 'ArrowRight') {
      if (answers[2][counter - 1]) {
        let currentScore = Number(score.innerText);
        score.innerText = (currentScore += 10).toString();
        playSoundsAfterAnswer('./sounds-game-audio-call/correct-answer-sound-3.mp3');
        answerResult.src = './assets/svg/icons/green-bird.svg';
        result.push(true);
        stats.wordCorrectAnswer(wordsId[counter - 1]);
      } else {
        playSoundsAfterAnswer('./sounds-game-audio-call/incorrect-answer-sound-3.mp3');
        answerResult.src = './assets/svg/icons/game/cross.svg';
        result.push(false);
        stats.wordUncorrectAnswer(wordsId[counter - 1]);
      }
    } else if (e.code === 'ArrowLeft') {
      if (answers[2][counter - 1]) {
        playSoundsAfterAnswer('./sounds-game-audio-call/incorrect-answer-sound-3.mp3');
        answerResult.src = './assets/svg/icons/game/cross.svg';
        result.push(false);
        stats.wordUncorrectAnswer(wordsId[counter - 1]);
      } else {
        let currentScore = Number(score.innerText);
        score.innerText = (currentScore += 10).toString();
        playSoundsAfterAnswer('./sounds-game-audio-call/correct-answer-sound-3.mp3');
        answerResult.src = './assets/svg/icons/green-bird.svg';
        result.push(true);
        stats.wordCorrectAnswer(wordsId[counter - 1]);
      }
    }
  };

  const removeKeyboardEvents = () => {
    document.removeEventListener('keydown', keyboardEvents);
  };

  window.addEventListener('hashchange', removeKeyboardEvents);
  document.addEventListener('keydown', keyboardEvents);

  soundIcon.addEventListener('click', () => {
    audioPaths.forEach((path, idx) => {
      if (counter === idx) {
        play(path);
      }
    });
  });

  prel.remove();
  timer();
};

export {
  renderSprintGame, userResponse, getWords, play,
};

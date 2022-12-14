import App from '../../components/app';
import { IdataStatistics } from './statistics';

export const addToLearnedWords = (id: string) => {
  const data: IdataStatistics = JSON.parse(sessionStorage.getItem('statistics') as string);
  data.optional.words[id] = {
    correctAnswers: data.optional.words[id] ? data.optional.words[id].correctAnswers : 0,
    nameGame: data.optional.words[id] ? data.optional.words[id].nameGame : '',
    firstlyUsedWord: data.optional.words[id] ? data.optional.words[id].firstlyUsedWord : new Date().toLocaleDateString('en-US'),
    dateLearnedWord: data.optional.words[id] ? data.optional.words[id].dateLearnedWord : new Date().toLocaleDateString('en-US'),
  };
  sessionStorage.setItem('statistics', JSON.stringify(data));
  new App().setStatistics();
};

export const deleteFromLearnedWords = (id: string) => {
  debugger;
  const data: IdataStatistics = JSON.parse(sessionStorage.getItem('statistics') as string);
  if (data.optional.words[id] && data.optional.words[id].dateLearnedWord) {
    delete data.optional.words[id].dateLearnedWord;
  }
  sessionStorage.setItem('statistics', JSON.stringify(data));
  new App().setStatistics();
};

import { handleOverflowIndex } from './players';

const shuffle = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const generateDeckOfCards = () => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = [
    '2', '3', '4', '5', '6', '7', '8', '9', '10', 
    'J', 'Q', 'K', 'A'
  ];
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  return deck;
};

const popCards = (deck, number) => {
  const mutableDeckCopy = [...deck];
  const chosenCards = mutableDeckCopy.splice(-number, number);
  return { mutableDeckCopy, chosenCards };
};

const dealPrivateCards = (state) => {
  state.clearCards = false;
  let animationDelay = 0;

  if (!state.players[state.activePlayerIndex]) {
    console.error('Active player is undefined:', state.activePlayerIndex, state.players);
    return state;
  }

  while (state.players[state.activePlayerIndex].cards.length < 2) {
    const { mutableDeckCopy, chosenCards } = popCards(state.deck, 1);
    chosenCards[0].animationDelay = animationDelay;
    animationDelay += 250;
    const newDeck = [...mutableDeckCopy];
    state.players[state.activePlayerIndex].cards.push(chosenCards[0]);
    state.deck = newDeck;
    state.activePlayerIndex = handleOverflowIndex(state.activePlayerIndex, 1, state.players.length, 'up');
    if (!state.players[state.activePlayerIndex]) {
      console.error('Active player is undefined after index change:', state.activePlayerIndex, state.players);
      return state;
    }
  }
  if (state.players.every(player => player.cards.length === 2)) {
    state.activePlayerIndex = handleOverflowIndex(state.blindIndex.big, 1, state.players.length, 'up');
    state.phase = 'betting1';
  }
  return state;
};

const dealMissingCommunityCards = (state) => {
  const cardsToDeal = 5 - state.communityCards.length;
  for (let i = 0; i < cardsToDeal; i++) {
    state.communityCards.push(state.deck.pop());
  }
  return state;
};

const showDown = (state) => {
  // Logic for showdown
  return state;
};

const analyzeHistogram = (cards) => {
  // Logic for analyzing histogram
  return {};
};

const buildValueSet = (cards) => {
  // Logic for building value set
  return new Set();
};

const checkStraight = (cards) => {
  // Logic for checking straight
  return false;
};

const checkFlush = (cards) => {
  // Logic for checking flush
  return false;
};

const checkStraightFlush = (cards) => {
  // Logic for checking straight flush
  return false;
};

const checkRoyalFlush = (cards) => {
  // Logic for checking royal flush
  return false;
};

const dealFlop = (state) => {
  const { mutableDeckCopy, chosenCards } = popCards(state.deck, 3);
  state.communityCards.push(...chosenCards);
  state.deck = mutableDeckCopy;
  return state;
};

const dealTurn = (state) => {
  const { mutableDeckCopy, chosenCards } = popCards(state.deck, 1);
  state.communityCards.push(chosenCards[0]);
  state.deck = mutableDeckCopy;
  return state;
};

const dealRiver = (state) => {
  const { mutableDeckCopy, chosenCards } = popCards(state.deck, 1);
  state.communityCards.push(chosenCards[0]);
  state.deck = mutableDeckCopy;
  return state;
};

export {
  shuffle,
  generateDeckOfCards,
  dealPrivateCards,
  dealMissingCommunityCards,
  showDown,
  analyzeHistogram,
  buildValueSet,
  checkStraight,
  checkFlush,
  checkStraightFlush,
  checkRoyalFlush,
  dealFlop,
  dealTurn,
  dealRiver
};
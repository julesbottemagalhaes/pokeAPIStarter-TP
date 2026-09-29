import { Pokemon } from './Pokemon.js';
import { typeColors } from './Type.js';

const API_URL = 'https://tyradex.app/api/v1';
const generationSelect = document.querySelector('#generation');
const languageSelect = document.querySelector('#language');
const sortSelect = document.querySelector('#sort');
const typeFilters = document.querySelector('#types');
const main = document.querySelector('main');
const cache = new Map();
const displayedPokemon = new WeakMap();
let selectedType = 'all';
let currentPokemonList = [];
let requestNumber = 0;

function getGeneration(number) {
  if (!cache.has(number)) {
    const promise = fetch(`${API_URL}/gen/${number}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Réponse Tyradex invalide');
        return data.map((pokemon) => new Pokemon(pokemon));
      })
      .catch((error) => {
        cache.delete(number);
        throw error;
      });
    cache.set(number, promise);
  }
  return cache.get(number);
}

function showMessage(message) {
  main.replaceChildren();
  const paragraph = document.createElement('p');
  paragraph.className = 'message';
  paragraph.textContent = message;
  main.append(paragraph);
}

function renderTypes(pokemonList) {
  const types = new Map();
  for (const pokemon of pokemonList) {
    for (const type of pokemon.arrTypes) {
      if (type.name && !types.has(type.name)) types.set(type.name, type.image);
    }
  }

  typeFilters.replaceChildren();
  const allButton = document.createElement('button');
  allButton.type = 'button';
  allButton.textContent = 'Tous';
  allButton.setAttribute('aria-label', 'Afficher tous les types');
  allButton.setAttribute('aria-pressed', String(selectedType === 'all'));
  allButton.addEventListener('click', () => selectType('all', pokemonList));
  typeFilters.append(allButton);

  for (const name of Object.keys(typeColors)) {
    const image = types.get(name);
    const button = document.createElement('button');
    button.type = 'button';
    button.title = name;
    button.setAttribute('aria-label', `Filtrer par type ${name}`);
    button.setAttribute('aria-pressed', String(selectedType === name));
    button.dataset.type = name;
    if (image) {
      const icon = document.createElement('img');
      icon.src = image;
      icon.alt = '';
      button.append(icon);
    }
    const label = document.createElement('span');
    label.textContent = name;
    button.append(label);
    button.addEventListener('click', () => selectType(name, pokemonList));
    typeFilters.append(button);
  }
}

function selectType(type, pokemonList) {
  selectedType = type;
  for (const button of typeFilters.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String((button.dataset.type || 'all') === type));
  }
  renderPokemon(pokemonList);
}

function renderPokemon(pokemonList) {
  const filtered = selectedType === 'all'
    ? [...pokemonList]
    : pokemonList.filter((pokemon) =>
        pokemon.arrTypes.some((type) => type.name === selectedType));

  main.replaceChildren();
  if (!filtered.length) {
    showMessage('Aucun Pokémon trouvé pour ce type.');
    return;
  }

  const compareNames = (first, second) => first.localeCompare(second, 'fr');
  filtered.sort((first, second) => {
    if (sortSelect.value === 'name') return compareNames(first.name, second.name);
    if (sortSelect.value === 'type') {
      return compareNames(first.arrTypes[0]?.name || '', second.arrTypes[0]?.name || '')
        || compareNames(first.name, second.name);
    }
    return (second[sortSelect.value] ?? -1) - (first[sortSelect.value] ?? -1)
      || compareNames(first.name, second.name);
  });

  const fragment = document.createDocumentFragment();
  for (const pokemon of filtered) {
    if (!pokemon.name) continue;
    const article = pokemon.displayCard(languageSelect.value);
    displayedPokemon.set(article, pokemon);
    fragment.append(article);
  }
  main.append(fragment);
}

async function loadGeneration() {
  const currentRequest = ++requestNumber;
  selectedType = 'all';
  currentPokemonList = [];
  typeFilters.replaceChildren();
  showMessage('Chargement des Pokémon…');

  try {
    const pokemonList = await getGeneration(generationSelect.value);
    if (currentRequest !== requestNumber) return;
    currentPokemonList = pokemonList;
    renderTypes(pokemonList);
    renderPokemon(pokemonList);
  } catch (error) {
    if (currentRequest !== requestNumber) return;
    console.error('Impossible de charger Tyradex :', error);
    showMessage('Impossible de charger les Pokémon. Réessayez en changeant de génération.');
  }
}

generationSelect.addEventListener('change', loadGeneration);
languageSelect.addEventListener('change', () => {
  for (const article of main.querySelectorAll('article')) {
    const name = displayedPokemon.get(article).getName(languageSelect.value);
    article.querySelector('h2').textContent = name;
    const image = article.querySelector('img');
    if (image) image.alt = name;
  }
});
sortSelect.addEventListener('change', () => {
  if (currentPokemonList.length) renderPokemon(currentPokemonList);
});
loadGeneration();

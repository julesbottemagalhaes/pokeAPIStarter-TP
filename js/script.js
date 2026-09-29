const API_URL = 'https://tyradex.app/api/v1';
const generationSelect = document.querySelector('#generation');
const languageSelect = document.querySelector('#language');
const sortSelect = document.querySelector('#sort');
const typeFilters = document.querySelector('#types');
const main = document.querySelector('main');
const cache = new Map();
const displayedPokemon = new WeakMap();
const typeColors = {
  "Plante": "#78C850",
  "Feu": "#F08030",
  "Eau": "#6890F0",
  "Insecte": "#A8B820",
  "Normal": "#A8A878",
  "Poison": "#A040A0",
  "Électrik": "#F8D030",
  "Sol": "#E0C068",
  "Vol": "#A890F0",
  "Combat": "#C03028",
  "Psy": "#F85888",
  "Roche": "#B8A038",
  "Spectre": "#705898",
  "Glace": "#98D8D8",
  "Dragon": "#7038F8",
  "Ténèbres": "#705848",
  "Acier": "#B8B8D0",
  "Fée": "#EE99AC"
}; 

let selectedType = 'all';
let currentPokemonList = [];
let requestNumber = 0;

class Type {
  constructor(data) {
    this.name = data.name;
    this.image = data.image;
    this.color = this.getColorHexa();
  }

  getColorHexa() {
    return typeColors[this.name] || '#777777';
  }
}

class Pokémon {
  constructor(data) {
    this.id = data.pokedex_id ?? data.pokedexId;
    this.image = data.sprites?.regular ?? data.image;
    this.name = data.name?.fr ?? data.name;
    this.names = typeof data.name === 'object' ? data.name : null;
    this.apiTypes = data.types ?? data.apiTypes ?? [];
    this.arrTypes = this.apiTypes.map((type) => new Type(type));
    this.hp = data.stats?.hp ?? data.stats?.HP;
    this.attack = data.stats?.atk ?? data.stats?.attack;
    this.defense = data.stats?.def ?? data.stats?.defense;
    this.special_attack = data.stats?.spe_atk ?? data.stats?.special_attack;
    this.special_defense = data.stats?.spe_def ?? data.stats?.special_defense;
    this.speed = data.stats?.vit ?? data.stats?.speed;
  }

  getName() {
    return this.names?.[languageSelect.value] || this.name;
  }

  displayCard() {
    const article = document.createElement('article');
    displayedPokemon.set(article, this);
    const color = this.arrTypes[0]?.color || '#777777';
    article.style.borderColor = color;
    article.style.backgroundColor = color;

    const figure = document.createElement('figure');
    const picture = document.createElement('picture');
    if (this.image) {
      const image = document.createElement('img');
      image.src = this.image;
      image.alt = this.getName();
      image.loading = 'lazy';
      picture.append(image);
    }

    const caption = document.createElement('figcaption');
    const typeLabel = document.createElement('span');
    typeLabel.className = 'types';
    typeLabel.textContent = this.arrTypes.map((type) => type.name).join(' / ') || 'Inconnu';
    const title = document.createElement('h2');
    title.textContent = this.getName();
    const stats = document.createElement('ol');
    for (const [label, value] of [
      ['Points de vie', this.hp], ['Attaque', this.attack], ['Défense', this.defense],
      ['Attaque spéciale', this.special_attack], ['Défense spéciale', this.special_defense],
      ['Vitesse', this.speed],
    ]) {
      const item = document.createElement('li');
      item.textContent = `${label} : ${value ?? '—'}`;
      stats.append(item);
    }
    caption.append(typeLabel, title, stats);
    figure.append(picture, caption);
    article.append(figure);
    return article;
  }
}

function getGeneration(number) {
  if (!cache.has(number)) {
    const promise = fetch(`${API_URL}/gen/${number}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Réponse Tyradex invalide');
        return data.map((pokemon) => new Pokémon(pokemon));
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
    fragment.append(pokemon.displayCard());
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
    const name = displayedPokemon.get(article).getName();
    article.querySelector('h2').textContent = name;
    const image = article.querySelector('img');
    if (image) image.alt = name;
  }
});
sortSelect.addEventListener('change', () => {
  if (currentPokemonList.length) renderPokemon(currentPokemonList);
});
loadGeneration();

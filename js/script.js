const API_URL = 'https://tyradex.app/api/v1';
const generationSelect = document.querySelector('#generation');
const typeFilters = document.querySelector('#types');
const main = document.querySelector('main');
const cache = new Map();

let selectedType = 'all';
let requestNumber = 0;

const typeColors = {
  Acier: '#246A79', Combat: '#9B3030', Dragon: '#1C6ABB', Eau: '#3979C6',
  Électrik: '#C99D00', Fée: '#BD5795', Feu: '#D46B20', Glace: '#398E91',
  Insecte: '#619D14', Normal: '#777777', Plante: '#43865A', Poison: '#8D4794',
  Psy: '#CD5A67', Roche: '#887A45', Sol: '#A56D37', Spectre: '#66517F',
  Ténèbres: '#514A53', Vol: '#647EB6',
};

function getGeneration(number) {
  if (!cache.has(number)) {
    const promise = fetch(`${API_URL}/gen/${number}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Réponse Tyradex invalide');
        return data;
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
    for (const type of pokemon?.types || []) {
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

  for (const [name, image] of types) {
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
    } else {
      button.textContent = name;
    }
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
    ? pokemonList
    : pokemonList.filter((pokemon) =>
        pokemon?.types?.some((type) => type.name === selectedType));

  main.replaceChildren();
  if (!filtered.length) {
    showMessage('Aucun Pokémon trouvé pour ce type.');
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const pokemon of filtered) {
    if (!pokemon || !pokemon.name?.fr) continue;
    const article = document.createElement('article');
    const primaryType = pokemon.types?.[0]?.name;
    const color = typeColors[primaryType] || '#777777';
    article.style.borderColor = color;
    article.style.backgroundColor = color;

    const figure = document.createElement('figure');
    const picture = document.createElement('picture');
    if (pokemon.sprites?.regular) {
      const image = document.createElement('img');
      image.src = pokemon.sprites.regular;
      image.alt = pokemon.name.fr;
      image.loading = 'lazy';
      picture.append(image);
    }

    const caption = document.createElement('figcaption');
    const typeLabel = document.createElement('span');
    typeLabel.className = 'types';
    typeLabel.textContent = pokemon.types?.map((type) => type.name).join(' / ') || 'Inconnu';
    const title = document.createElement('h2');
    title.textContent = pokemon.name.fr;
    const stats = document.createElement('ol');
    for (const [label, key] of [
      ['Points de vie', 'hp'], ['Attaque', 'atk'], ['Défense', 'def'],
      ['Attaque spéciale', 'spe_atk'], ['Défense spéciale', 'spe_def'], ['Vitesse', 'vit'],
    ]) {
      const item = document.createElement('li');
      item.textContent = `${label} : ${pokemon.stats?.[key] ?? '—'}`;
      stats.append(item);
    }
    caption.append(typeLabel, title, stats);
    figure.append(picture, caption);
    article.append(figure);
    fragment.append(article);
  }
  main.append(fragment);
}

async function loadGeneration() {
  const currentRequest = ++requestNumber;
  selectedType = 'all';
  typeFilters.replaceChildren();
  showMessage('Chargement des Pokémon…');

  try {
    const pokemonList = await getGeneration(generationSelect.value);
    if (currentRequest !== requestNumber) return;
    renderTypes(pokemonList);
    renderPokemon(pokemonList);
  } catch (error) {
    if (currentRequest !== requestNumber) return;
    console.error('Impossible de charger Tyradex :', error);
    showMessage('Impossible de charger les Pokémon. Réessayez en changeant de génération.');
  }
}

generationSelect.addEventListener('change', loadGeneration);
loadGeneration();

import { Type } from './Type.js';

export class Pokemon {
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

  getName(language) {
    return this.names?.[language] || this.name;
  }

  displayCard(language) {
    const article = document.createElement('article');
    const color = this.arrTypes[0]?.color || '#777777';
    article.style.borderColor = color;
    article.style.backgroundColor = color;

    const figure = document.createElement('figure');
    const picture = document.createElement('picture');
    if (this.image) {
      const image = document.createElement('img');
      image.src = this.image;
      image.alt = this.getName(language);
      image.loading = 'lazy';
      picture.append(image);
    }

    const caption = document.createElement('figcaption');
    const typeLabel = document.createElement('span');
    typeLabel.className = 'types';
    typeLabel.textContent = this.arrTypes.map((type) => type.name).join(' / ') || 'Inconnu';
    const title = document.createElement('h2');
    title.textContent = this.getName(language);
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

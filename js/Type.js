export const typeColors = {
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

export class Type {
  constructor(data) {
    this.name = data.name;
    this.image = data.image;
    this.color = this.getColorHexa();
  }

  getColorHexa() {
    return typeColors[this.name] || '#777777';
  }
}

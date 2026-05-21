# Flag Voice Challenge

Een kleine JavaScript eindopdracht met Teachable Machine audio: de speler ziet een vlag, zegt de landnaam in de microfoon en krijgt een punt als het model de juiste naam herkent. De beste score wordt bewaard met `localStorage`.

## Teachable Machine model maken

1. Ga naar Teachable Machine en kies **Audio Project**.
2. Maak per land een class met dezelfde naam als in de game, bijvoorbeeld `Belgie`, `Frankrijk`, `Duitsland`, `Nederland`, `Spanje`, `Italie`, `Portugal`, `Japan`, `Brazilie`, `Canada`.
3. Neem meerdere samples op per class. Spreek duidelijk de landnaam uit.
4. Train het model.
5. Klik op **Export Model**, upload het model en kopieer de share-link.
6. Plak die link in het inputveld van de game.

## Lokaal starten

Open `index.html` in je browser. Voor microfoon-permissies werkt Chrome meestal het makkelijkst.

## Planning tot deadline

- Dag 1: basisgame, vlaggen, score, localStorage.
- Dag 2: Teachable Machine audio koppelen en model trainen.
- Dag 3: testen, styling verbeteren, demo oefenen en laatste push.

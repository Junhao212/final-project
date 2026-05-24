# Flag Voice Challenge

Een kleine JavaScript eindopdracht met Teachable Machine audio: de speler ziet een vlag, zegt de landnaam in de microfoon en krijgt een punt als het model de juiste naam herkent. De beste score wordt bewaard met `localStorage`.

## Teachable Machine model maken

1. Ga naar Teachable Machine en kies **Audio Project**.
2. Maak per land een class met dezelfde naam als in de game, bijvoorbeeld `Belgie`, `Frankrijk`, `Duitsland`, `Nederland`, `Spanje`, `Italie`, `Portugal`, `Japan`, `Brazilie`, `Canada`.
3. Laat de standaard class `Background Noise` bestaan. Die wordt genegeerd door de game.
4. Neem meerdere samples op per land. Spreek duidelijk de landnaam uit.
5. Train het model.
6. Klik op **Export Model**, upload het model en kopieer de share-link.
7. Plak die link in het inputveld van de game.

De game checkt na het laden of alle land-labels in het model zitten. Als er iets mist, staat dat onder het inputveld.

## Lokaal starten

Open `index.html` in je browser. Voor microfoon-permissies werkt Chrome meestal het makkelijkst.

## Demo checklist

- Open de live applicatie in een incognito venster.
- Klik op **Start microfoon** en zeg de naam van de vlag.
- Toon dat de score omhoog gaat bij een juist antwoord.
- Toon in DevTools dat `localStorage` de beste score en model-link bewaart.

## Planning tot deadline

- Dag 1: basisgame, vlaggen, score, localStorage.
- Dag 2: Teachable Machine audio koppelen en model trainen.
- Dag 3: testen, styling verbeteren, demo oefenen en laatste push.

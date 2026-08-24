# Fényes Takarítás

Egyoldalas (single-page) céges weboldal takarítási szolgáltatást nyújtó vállalkozás számára, magyar nyelven, a magyar piacra optimalizálva.

🔗 **Élő oldal:** https://vargagyorgy1204-create.github.io/fenyes/ *(ha a GitHub Pages be van kapcsolva a repóban)*

## Áttekintés

A weboldal egy modern, professzionális takarítási szolgáltató cég landing page-ét mutatja be: bemutatkozás, szolgáltatások, statisztikák, ügyfélvélemények, csapat és kapcsolatfelvételi lehetőségek egyetlen görgethető oldalon.

### Fő szekciók

- **Fejléc** – navigáció, telefonszám, "Ingyenes Árajánlat" gomb, mobilon kihúzható menü
- **Hero** – bemutatkozó szöveg, CTA gombok, kiemelt statisztika-jelvények
- **Bizalmi sáv** – képzett szakemberek, környezetbarát szerek, garancia, rugalmas időbeosztás
- **Szolgáltatások** – lakás-, iroda-, mély-, költözési, szőnyeg- és ablaktisztítás kártyák
- **Statisztikák** – animált számlálók (ügyfelek, projektek, elégedettség, tapasztalat)
- **Folyamat** – 4 lépéses "hogyan működik" bemutató
- **Vélemények** – görgethető ügyfél-testimonial kártyák
- **CTA banner** – gyors kapcsolatfelvételi felhívás
- **Csapat** – munkatársak bemutatása fotókkal
- **Partnerek** – márkalogók sáv
- **Hírlevél feliratkozás**
- **Lábléc** – elérhetőségek, gyors linkek, közösségi média

## Technológia

Tiszta, függőségmentes front-end stack — nincs build lépés, nincs keretrendszer:

- **HTML5** – szemantikus, akadálymentes jelölés
- **CSS3** – egyedi stílusrendszer CSS változókkal (design token-ek), reszponzív rácsok, animációk
- **Vanilla JavaScript** – mobilmenü, görgetésre aktiválódó animációk (`IntersectionObserver`), animált számlálók, testimonial csúszka, görgetési folyamatjelző sáv, finom parallax effekt

## Projektstruktúra

```
├── index.html          # Az oldal teljes tartalma és szerkezete
├── css/
│   └── style.css        # Az összes stílus (design tokenek, layout, animációk)
├── js/
│   └── script.js        # Interaktivitás (menü, görgetési effektek, csúszka, űrlapok)
├── images/               # Optimalizált fotók (hero, csapat, ügyfelek, szolgáltatások)
└── .gitignore
```

## Futtatás helyben

Nincs szükség telepítésre vagy build folyamatra — az oldal statikus fájlokból áll.

1. Klónozd a repót:
   ```bash
   git clone https://github.com/vargagyorgy1204-create/fenyes.git
   cd fenyes
   ```
2. Nyisd meg az `index.html` fájlt közvetlenül a böngészőben, vagy indíts egy egyszerű helyi szervert:
   ```bash
   python -m http.server 8000
   ```
   majd látogass el a `http://localhost:8000` címre.

## Reszponzivitás

Az oldal teszteltre lett tervezve 375px-től 1440px-ig terjedő képernyőszélességeken (mobil, tablet, desktop), beleértve a mobilmenüt és a vízszintesen görgethető szekciókat is.

## Licenc

Ez egy demó/portfólió projekt.

# Belthor Automotive – demo-website

Statische demo (HTML, CSS en JavaScript), zonder database en zonder build-stap.

## Lokaal bekijken
Dubbelklik op `index.html`, of start in deze map een lokale server:

```bash
npx serve .
```

Open daarna http://localhost:3000.

## Naar Vercel
1. Push deze map naar een GitHub-repo.
2. Vercel → Add New → Project → kies de repo.
3. Framework Preset: **Other**. Build Command: leeg. Output Directory: leeg (root).
4. Deploy.

## Wat werkt in de demo
- Site in 4 talen (FR/NL/PT/EN), met aanbod, filters, sorteren en detailpagina's.
- De formulieren openen WhatsApp met het bericht al ingevuld (+32 465 17 84 88).
- `admin.html`: demo-beheer. Elk e-mailadres en wachtwoord werkt. Je kan advertenties toevoegen, bewerken en verwijderen, foto's uploaden en de bedrijfsgegevens invullen.
  Alles wordt **alleen in de eigen browser** bewaard (localStorage). Een bezoeker op een ander toestel ziet die wijzigingen niet.
  Met de knop "Demo herstellen" zet je alles terug.

## Voorbeeldwagens
De voorbeeldwagens staan in `js/data.js`. Er staan enkel gegevens in die duidelijk in de Instagram-posts van Belthor stonden. Onbekende velden staan op `null` en worden als "—" getoond.
Bij de Renault Trafic staat "excl. btw", zoals in de post. Bij de andere wagens staat geen btw-vermelding, omdat dat nog niet bevestigd is.
Echte foto's toevoegen kan via de admin-demo, of door ze in `img/` te zetten en het pad in `photos: ["img/naam.jpg"]` te plaatsen.

## Teksten
Alle teksten staan in `js/i18n.js`, per taal met dezelfde sleutels.

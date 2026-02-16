# Inventarsystem

Ein modernes Inventarsystem mit MongoDB, React-Frontend und Node.js/Express-Backend.

## Features

- **Inventar-Verwaltung**: Items hinzufügen, bearbeiten und löschen
- **Kalender-System**: Buchungen im Kalender verwalten
- **Kundenverwaltung**: Kunden anlegen und verwalten
- **Authentifizierung**: JWT-basierte Benutzer-Authentifizierung
- **Responsive Design**: Funktioniert auf Desktop und Mobile

## Technologie-Stack

- **Frontend**: React 18, React Big Calendar, Axios (per Nginx ausgeliefert)
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Datenbank**: MongoDB (im Docker-Stack)
- **Deployment**: Docker Compose, Zugriff über externen Nginx (Reverse-Proxy)

---

## Deployment auf Ubuntu-Server

Die App läuft vollständig in Docker. Der Zugriff erfolgt über einen **Nginx auf einer anderen VM**, der auf den Docker-Host (Port 3000 = Frontend, Port 5000 = Backend) weiterleitet.

### Voraussetzungen auf dem Docker-Host

- Ubuntu (oder vergleichbar)
- Docker und Docker Compose
- Git

### 1. Docker und Docker Compose installieren

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git

# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Danach ab- und wieder anmelden, damit die Gruppe gilt.

# Docker Compose (Plugin)
sudo apt install -y docker-compose-plugin
```

Prüfen: `docker --version` und `docker compose version`.

### 2. Projekt klonen und einrichten

```bash
sudo git clone <IHR-GITHUB-REPO> /opt/evju_inv
cd /opt/evju_inv
sudo chown -R $USER:$USER /opt/evju_inv
```

### 3. Umgebung konfigurieren

```bash
cp .env.example .env
nano .env
```

**Wichtige Einträge in `.env`:**

| Variable         | Bedeutung |
|------------------|-----------|
| `JWT_SECRET`     | Geheimer Schlüssel für JWT (unbedingt stark und einzigartig setzen) |
| `MONGO_PASSWORD` | MongoDB-Passwort (Standard in .env.example: changeme) |
| `FRONTEND_URL`   | Exakt die URL, unter der Nutzer die App aufrufen (z. B. `https://inventory.deinedomain.de`). Wichtig für CORS/Cookies. |

### 4. Erster Start

```bash
docker compose up -d
```

Ersten Admin-Benutzer anlegen:

```bash
docker compose exec backend node scripts/createAdmin.js
```

### 5. Reverse-Proxy in Nginx Proxy Manager

Die App wird über **Nginx Proxy Manager** (Dashboard) angebunden.  
`<DOCKER-HOST-IP>` = IP des Rechners, auf dem Docker Compose läuft (z. B. `192.168.1.10`).

**Im Nginx Proxy Manager:**

1. **Hosts → Proxy Hosts → Add Proxy Host**
   - **Domain Names:** deine Subdomain (z. B. `inventory.deinedomain.de`)
   - **Scheme:** `http`
   - **Forward Hostname / IP:** `<DOCKER-HOST-IP>`
   - **Forward Port:** `3000` (Frontend)
   - **Cache Assets:** optional an
   - **Block Common Exploits:** optional an  
   Speichern (Save). SSL später unter „SSL“ tab einrichten.

2. **Custom Location für die API** (damit `/api` zum Backend geht):
   - Beim gleichen Proxy Host auf **„Custom locations“** (oder **Edit** → Tab **Custom locations**) → **Add location**
   - **Define location:** `/api`
   - **Scheme:** `http`
   - **Forward Hostname / IP:** `<DOCKER-HOST-IP>`
   - **Forward Port:** `5000`
   - **Advanced** (falls vorhanden): leer lassen oder nur Proxy-Header wie unten, NPM setzt sie oft schon.  
   Speichern.

3. **SSL** (empfohlen): Beim Proxy Host im Tab **SSL** „Request a new SSL Certificate“ wählen (Let’s Encrypt), Domain eintragen, speichern.

**Wichtig:** `FRONTEND_URL` in der `.env` des Projekts muss genau die URL sein, unter der Nutzer die App aufrufen (z. B. `https://inventory.deinedomain.de`) – sonst CORS/Login-Probleme.

Nutzer rufen die App **nur über diese URL** auf, nicht direkt über die Ports des Docker-Hosts.

---

## Updates (neue Version laden)

Im Projektordner auf dem Ubuntu-Server:

```bash
chmod +x deploy.sh   # nur beim ersten Mal nötig
./deploy.sh
```

Das Skript `deploy.sh` macht:

1. `git pull`
2. Docker-Container neu bauen (`docker compose build --no-cache`)
3. Container neu starten (`docker compose up -d`)

Falls `docker compose` nicht verfügbar ist (ältere Setup), nutzt das Skript automatisch `docker-compose`.

---

## Wartung

### Logs

```bash
docker compose logs -f          # alle Dienste
docker compose logs -f backend  # nur Backend
docker compose logs -f mongodb  # nur MongoDB
```

### MongoDB-Backup

```bash
# Backup (Passwort ggf. anpassen)
docker compose exec mongodb mongodump --out /data/backup --username admin --password changeme --authenticationDatabase admin

# Wiederherstellen
docker compose exec mongodb mongorestore /data/backup --username admin --password changeme --authenticationDatabase admin
```

### Container-Status

```bash
docker compose ps
```

---

## Sicherheitshinweise

1. **JWT_SECRET** in `.env` stark und einzigartig setzen.
2. **MONGO_PASSWORD** von „changeme“ ändern (in `.env` und ggf. auf der Nginx-VM nicht nötig).
3. **FRONTEND_URL** exakt auf die öffentliche URL setzen (inkl. https), unter der die App erreichbar ist.
4. Firewall: Nur nötige Ports öffnen (z. B. 22, 3000, 5000 nur für Nginx-VM erreichbar).
5. In Production HTTPS über den Nginx verwenden (z. B. Let’s Encrypt).

---

## Fehlerbehebung

**Container starten nicht / Fehler beim Build**

- Logs prüfen: `docker compose logs`
- `.env` prüfen (vorhanden, JWT_SECRET und FRONTEND_URL gesetzt).
- Ports 3000 und 5000 frei? `sudo ss -tlnp | grep -E '3000|5000'`

**MongoDB verbindet nicht**

- `docker compose ps` – läuft `inventory-mongodb`?
- `docker compose restart mongodb` und kurz warten, dann `docker compose up -d` erneut.

**App im Browser erreichbar, aber API-Fehler**

- `FRONTEND_URL` in `.env` muss genau die URL sein, die der Browser nutzt (inkl. https).
- Nginx-Config: `/api` muss auf `<DOCKER-HOST-IP>:5000` zeigen.

---

## Lizenz

ISC

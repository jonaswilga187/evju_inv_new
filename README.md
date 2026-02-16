# Inventarsystem

Ein modernes Inventarsystem mit MongoDB, React-Frontend und Node.js/Express-Backend.

## Features

- **Inventar-Verwaltung**: Items hinzufügen, bearbeiten und löschen
- **Kalender-System**: Buchungen im Kalender verwalten
- **Kundenverwaltung**: Kunden anlegen und verwalten
- **Authentifizierung**: JWT-basierte Benutzer-Authentifizierung
- **Responsive Design**: Funktioniert auf Desktop und Mobile

## Technologie-Stack

- **Frontend**: React 18, React Big Calendar, Axios
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Datenbank**: MongoDB (via Docker Compose)
- **Authentifizierung**: JWT (JSON Web Tokens)

## Voraussetzungen

- Node.js (v16 oder höher)
- npm oder yarn
- Docker und Docker Compose
- Git

## Start mit Docker Compose (Homeserver)

Wenn du die Anwendung auf einem Server (z. B. Homeserver) vollständig mit Docker betreiben willst – inkl. Frontend und Backend – reicht Folgendes. Der Zugriff erfolgt über deinen **bestehenden Nginx auf einer anderen VM**; die Docker-Container liefern nur die Dienste und exponieren Port 3000 (Frontend) und 5000 (Backend).

### Auf dem Docker-Host (VM mit Docker Compose)

```bash
git clone <IHR-GITHUB-REPO> evju_inv
cd evju_inv

cp .env.example .env
# .env anpassen: JWT_SECRET (unbedingt ändern!), MONGO_PASSWORD, FRONTEND_URL
# FRONTEND_URL = exakt die URL, unter der dein Nginx die App ausliefert (z. B. https://inventory.deinedomain.de)

docker-compose up -d
```

**Erster Admin-Benutzer anlegen:**

```bash
docker-compose exec backend node scripts/createAdmin.js
```

### Auf der Nginx-VM (Reverse-Proxy)

Nginx läuft auf einer **anderen VM**. Dort eine Server-Block-Konfiguration für die App ergänzen (z. B. unter `sites-available`). `<DOCKER-HOST-IP>` = IP des Rechners, auf dem `docker-compose` läuft.

```nginx
# Beispiel: Server für inventory.deinedomain.de
server {
    listen 80;   # bzw. 443 mit ssl, wenn du SSL nutzt
    server_name inventory.deinedomain.de;

    location / {
        proxy_pass http://<DOCKER-HOST-IP>:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://<DOCKER-HOST-IP>:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Anschließend Nginx neu laden (`sudo systemctl reload nginx` oder `sudo nginx -s reload`). Nutzer rufen die App **nur über die Nginx-URL** auf (nicht direkt über die Docker-Host-Ports).

**Hinweis:** `FRONTEND_URL` in der `.env` des Projekts muss genau diese URL sein (z. B. `https://inventory.deinedomain.de`), wenn du HTTPS nutzt – wichtig für CORS und Cookies.

**Updates (Docker):** Nach `git pull` auf dem Docker-Host: `docker-compose build --no-cache && docker-compose up -d`.

## Installation auf Ubuntu Server

### 1. System-Updates und Basis-Pakete

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

### 2. Node.js installieren

```bash
# Node.js 18.x installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installation überprüfen
node --version
npm --version
```

### 3. Docker installieren

```bash
# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose installieren
sudo apt install -y docker-compose

# Docker ohne sudo ausführen (optional)
sudo usermod -aG docker $USER
# Nach diesem Befehl neu einloggen!

# Installation überprüfen
docker --version
docker-compose --version
```

### 4. Projekt klonen und einrichten

```bash
# Projekt in gewünschtes Verzeichnis klonen
cd /opt  # oder ein anderes Verzeichnis Ihrer Wahl
sudo git clone <IHR-REPOSITORY-URL> inventory-system
cd inventory-system

# Berechtigungen setzen
sudo chown -R $USER:$USER .
```

### 5. Backend einrichten

```bash
cd backend

# Dependencies installieren
npm install

# Environment-Datei erstellen
cp .env.example .env

# .env Datei bearbeiten (wichtig: JWT_SECRET ändern!)
nano .env
```

**Wichtige .env Einstellungen:**
```env
MONGODB_URI=mongodb://admin:changeme@localhost:27017/inventory?authSource=admin
JWT_SECRET=IHRE-SICHERE-ZUFÄLLIGE-ZEICHENKETTE-HIER
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 6. Frontend einrichten

```bash
cd ../frontend

# Dependencies installieren
npm install

# Environment-Datei erstellen
cp .env.example .env

# .env Datei bearbeiten
nano .env
```

**Frontend .env:**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 7. MongoDB mit Docker Compose starten

```bash
cd ..

# MongoDB Container starten
docker-compose up -d

# Status überprüfen
docker-compose ps

# Logs anzeigen (optional)
docker-compose logs -f mongodb
```

### 8. Backend starten (Development)

```bash
cd backend
npm start
```

### 9. Frontend starten (Development)

```bash
# In einem neuen Terminal
cd frontend
npm start
```

Die Anwendung sollte jetzt unter `http://localhost:3000` erreichbar sein.

## Production Deployment

### Backend mit PM2

```bash
# PM2 global installieren
sudo npm install -g pm2

# Backend mit PM2 starten
cd backend
pm2 start server.js --name inventory-backend

# PM2 beim Systemstart aktivieren
pm2 startup
pm2 save

# Status überprüfen
pm2 status

# Logs anzeigen
pm2 logs inventory-backend
```

### Frontend Build

```bash
cd frontend

# Production Build erstellen
npm run build

# Build-Verzeichnis wird in frontend/build/ erstellt
```

### Nginx Konfiguration (Optional)

```bash
# Nginx installieren
sudo apt install -y nginx

# Konfigurationsdatei erstellen
sudo nano /etc/nginx/sites-available/inventory
```

**Nginx Konfiguration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Ihre Domain oder IP

    # Frontend
    location / {
        root /opt/inventory-system/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Symbolischen Link erstellen
sudo ln -s /etc/nginx/sites-available/inventory /etc/nginx/sites-enabled/

# Nginx Konfiguration testen
sudo nginx -t

# Nginx starten/neu laden
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### SSL/HTTPS mit Let's Encrypt (Optional)

```bash
# Certbot installieren
sudo apt install -y certbot python3-certbot-nginx

# SSL-Zertifikat erstellen
sudo certbot --nginx -d your-domain.com

# Automatische Erneuerung testen
sudo certbot renew --dry-run
```

## Wartung

### MongoDB Backup

```bash
# Backup erstellen
docker exec inventory-mongodb mongodump --out /data/backup --username admin --password changeme --authenticationDatabase admin

# Backup wiederherstellen
docker exec inventory-mongodb mongorestore /data/backup --username admin --password changeme --authenticationDatabase admin
```

### Logs anzeigen

```bash
# Backend Logs (PM2)
pm2 logs inventory-backend

# MongoDB Logs
docker-compose logs mongodb

# Nginx Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Updates

```bash
# Code aktualisieren
git pull

# Backend Dependencies aktualisieren
cd backend
npm install

# Frontend Dependencies aktualisieren
cd ../frontend
npm install
npm run build

# Backend neu starten
pm2 restart inventory-backend

# Nginx neu laden
sudo systemctl reload nginx
```

## Sicherheitshinweise

1. **JWT_SECRET ändern**: Verwenden Sie einen starken, zufälligen Secret-Key in Production
2. **MongoDB Passwort ändern**: Ändern Sie das Standard-Passwort in docker-compose.yml
3. **Firewall konfigurieren**: Nur notwendige Ports öffnen (80, 443, 22)
4. **Regelmäßige Backups**: Erstellen Sie regelmäßig Backups der MongoDB-Datenbank
5. **HTTPS verwenden**: In Production immer HTTPS verwenden

## Fehlerbehebung

### MongoDB verbindet nicht

```bash
# Container Status prüfen
docker-compose ps

# Container neu starten
docker-compose restart mongodb

# Logs prüfen
docker-compose logs mongodb
```

### Backend startet nicht

```bash
# Port bereits belegt?
sudo lsof -i :5000

# Node Modules neu installieren
cd backend
rm -rf node_modules
npm install
```

### Frontend Build Fehler

```bash
# Cache löschen
cd frontend
rm -rf node_modules build
npm install
npm run build
```

## Support

Bei Problemen oder Fragen erstellen Sie bitte ein Issue im Repository.

## Lizenz

ISC


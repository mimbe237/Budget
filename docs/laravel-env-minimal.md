# Environnement local minimal pour tester un projet Laravel

Ce guide décrit la configuration la plus légère possible pour exécuter les tests d'un projet Laravel sans provisionner toute l'infrastructure backend (MySQL, Redis, etc.). L'idée est d'utiliser PHP/Composer en natif et SQLite comme base de données locale.

## 1. Pré-requis système

| Outil | Version recommandée | Notes |
| --- | --- | --- |
| PHP | 8.2.x | Avec les extensions `mbstring`, `openssl`, `pdo`, `pdo_sqlite`, `tokenizer`, `xml`, `curl` |
| Composer | 2.6+ | Permet d'installer les dépendances PHP |
| Node.js | 18 LTS | Uniquement si le projet possède un front-end compilé (Vite, Mix) |
| npm ou bun | — | Pour installer les dépendances front |
| SQLite | 3.x | Évite d'installer MySQL/Postgres pour les tests |

Sur macOS, la façon la plus simple est d'utiliser [Homebrew](https://brew.sh) :

```bash
brew install php composer sqlite node
```

Sur Windows, privilégiez [Scoop](https://scoop.sh) ou WSL2 + Ubuntu pour obtenir un environnement proche de la prod.

## 2. Initialisation du projet

1. **Cloner le dépôt**
   ```bash
   git clone <URL_DU_REPO> && cd <NOM_DU_PROJET>
   ```
2. **Installer les dépendances PHP**
   ```bash
   composer install
   ```
3. **Installer les dépendances front (si nécessaire)**
   ```bash
   npm install
   ```
4. **Créer le fichier `.env`**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

## 3. Base de données minimale avec SQLite

1. Créer un fichier de base SQLite :
   ```bash
   touch database/database.sqlite
   ```
2. Mettre à jour `.env` avec les valeurs suivantes :
   ```
   DB_CONNECTION=sqlite
   DB_DATABASE=/chemin/vers/le/projet/database/database.sqlite
   ```
   *Toutes les autres variables `DB_*` peuvent rester commentées.*
3. Exécuter les migrations et, si besoin, les seeders :
   ```bash
   php artisan migrate --seed
   ```

SQLite suffit pour la majorité des tests de couche application. Si des tests exigent MySQL/Postgres, utilisez une image Docker légère (ex. `docker run --rm -p3306:3306 -e ... mysql:8`) ou Laravel Sail.

## 4. Lancement des tests

- Tests applicatifs : `php artisan test`
- Tests unitaires ciblés : `php artisan test tests/Unit/MonTest.php`
- Tests front (Vite/Jest/Vitest) : `npm test` (optionnel)

### Exécution continue

Pour itérer rapidement :
```bash
php artisan test --parallel --recreate-databases
```
Cela relance SQLite à partir d'un snapshot pour chaque worker.

## 5. Option Docker/Sail ultra-légère

Si vous ne voulez pas installer PHP en natif :

```bash
curl -s "https://laravel.build/min-stack?with=none&php=82" | bash
cd min-stack
./vendor/bin/sail up -d
./vendor/bin/sail test
```

Adaptez la commande `laravel.build` au dépôt courant (ajoutez `?with=mysql,redis` si nécessaire). Sail embarque PHP, Composer, MySQL et Redis dans des conteneurs isolés.

## 6. Résolution de problèmes courants

- **`pdo_sqlite` manquant** : Vérifiez `php -m | grep sqlite`. Si absent, réinstallez PHP avec l’extension (`brew reinstall php`).
- **Permissions sur `database.sqlite`** : Assurez-vous que l’utilisateur courant a les droits d’écriture.
- **Tests lents** : Utilisez `php artisan test --parallel` + SQLite, supprimez les dépendances `--seed` si non indispensables.
- **Front-end requis** : Pour les tests de fonctionnalités qui compilent le front, exécutez `npm run build` une fois avant `php artisan test`.

## 7. Nettoyage

```
rm -rf vendor node_modules database/database.sqlite
```

Cette commande supprime toutes les dépendances et la base de test. Idéal pour repartir d’un environnement propre.

---

Avec ce setup, vous disposez d’un environnement reproductible, léger et suffisamment complet pour lancer la suite de tests Laravel en local sans dépendances serveur lourdes.

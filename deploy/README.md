# Despliegue Producción (Servidor Público)

Este directorio contiene la configuración para ejecutar el backend y la base de datos en un servidor (VPS o dedicado) accesible a los estudiantes.

## Componentes
- **MariaDB 10.6**: Base de datos persistente.
- **Backend Node.js**: API y endpoints SSE.
- **Caddy**: Proxy inverso, HTTPS automático (Let's Encrypt) y cabeceras de seguridad.
- **Adminer (opcional)**: Panel simple para la BD (no expuesto públicamente por defecto).

## Requisitos del Servidor
- Linux (Ubuntu 22.04 recomendado) o similar.
- Docker Engine + Docker Compose Plugin instalados.
- Dominio apuntado (DNS A) a la IP pública del servidor.

### Instalación Docker (Ubuntu)
```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
# Cerrar sesión y volver a entrar
```

## Pasos de Despliegue
1. Copia el repositorio al servidor (git clone o rsync).
2. Entra al directorio `deploy/`.
3. Crea archivo `backend.env` a partir de `backend.env.example`:
   ```bash
   cp backend.env.example backend.env
   nano backend.env
   # Personaliza DB_PASSWORD, JWT_SECRET, etc.
   ```
4. Exporta variables para dominio y email:
   ```bash
   export APP_DOMAIN=reservas.uniguajira.edu.co
   export ACME_EMAIL=admin@uniguajira.edu.co
   export DB_ROOT_PASSWORD="cambia_root"
   export DB_PASSWORD="appsecret_seguro"
   export DB_USER="appuser"
   export DB_NAME="gestion_de_recursos"
   ```
5. Levanta servicios:
   ```bash
   docker compose up -d --build
   ```
6. Verifica contenedores:
   ```bash
   docker compose ps
   docker compose logs backend | tail -n 50
   ```
7. Prueba healthcheck:
   ```bash
   curl -s https://$APP_DOMAIN/api/health | jq
   ```

## Primer Arranque y Esquema
- `SKIP_SCHEMA=0` permite que el backend aplique ALTER TABLE mínimos.
- Después del primer arranque, puedes editar `backend.env` y poner `SKIP_SCHEMA=1` para acelerar futuros reinicios.
- Para aplicar cambios tras editar env: `docker compose up -d --force-recreate --build backend`.

## Actualizaciones
```bash
git pull
docker compose build backend
docker compose up -d backend
```

## Respaldos de Base de Datos
```bash
docker exec yen_db mysqldump -uappuser -p"$DB_PASSWORD" $DB_NAME > backup-$(date +%F).sql
```

## Restaurar
```bash
cat backup.sql | docker exec -i yen_db mysql -uappuser -p"$DB_PASSWORD" $DB_NAME
```

## Seguridad
- Cambia todas las contraseñas por valores fuertes.
- Restringe Adminer (no expongas puerto). Usa túnel SSH si necesitas acceso: `ssh -L 8080:localhost:8080 usuario@servidor` y luego expón internamente.
- Revisa logs: `docker compose logs -f backend`.
- Usa fail2ban y firewall UFW si aplica.

## Escalado Posterior
- Separar DB en instancia administrada (Azure/MySQL RDS) si crece.
- Añadir un servicio frontend estático (Nginx/Caddy) si se sirve también la UI web desde el dominio.
- Montar monitoreo (Prometheus + Grafana, Uptime Kuma) para `/api/health`.

## Comandos Rápidos
```bash
# Ver estado
curl -s https://$APP_DOMAIN/api/health | jq
# Logs backend
docker compose logs -f backend
# Reinicio backend
docker compose restart backend
```

## Troubleshooting
- Health `db:error`: verificar credenciales en `backend.env` y que contenedor db esté `running`.
- Error SSL: comprobar DNS correcto y puertos 80/443 abiertos.
- SSE no conecta: revisar cabeceras proxy y network; Caddyfile ya pasa Host.

---
Este despliegue hace el servidor público y listo para uso institucional.

# Nueve Car — Web de precios (GitHub Pages)

Este proyecto genera una web pública para ver precios de **motos/autos/cascos/bicicletas** (y lo que agreguen) desde un archivo de datos.

## Estructura
- `index.html`: catálogo con buscador, filtros y ordenamiento
- `admin.html`: panel **modo local** (agregar/editar/borrar) + **exportar `inventory.json`**
- `data/inventory.json`: datos (se actualiza reemplazando el archivo y haciendo commit)

## Publicar en GitHub Pages (rápido)
1. Crear repo (ej: `nueve-car-precios`)
2. Subir estos archivos al repo
3. En GitHub: **Settings → Pages**
   - Source: `Deploy from a branch`
   - Branch: `main` y carpeta `/ (root)`
4. Guardar. El sitio queda con una URL tipo:
   `https://TU_USUARIO.github.io/nueve-car-precios/`

## ¿Cómo “cargamos” productos nuevos?
GitHub Pages no tiene base de datos, así que la forma simple es:

1. Abrir `admin.html`
2. Cargar o editar items
3. Click **Exportar inventory.json**
4. Reemplazar en el repo: `data/inventory.json`
5. Commit + push

Listo: la web se actualiza para todos.

> Si más adelante querés un panel con login que guarde directo en GitHub sin descargar/subir, se puede integrar un CMS con OAuth, pero requiere configuración extra.
# Refactorización: Nueva Estructura de Carpetas

Se ha iniciado la reorganización del proyecto para mejorar la legibilidad y modularidad. Se han creado las siguientes carpetas:

- modules/: lógica de dominio (artículos, newsletter, mercado, imágenes, IA, usuarios)
- tests/: para futuros tests unitarios, integración y e2e

Cada subcarpeta contiene un README explicativo. El siguiente paso será migrar la lógica de negocio específica de cada dominio desde services/ y scripts/ hacia modules/, y dejar services/ solo para integraciones externas y lógica transversal.

Esta estructura facilita la escalabilidad, el mantenimiento y la comprensión tanto para humanos como para agentes de IA.
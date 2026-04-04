import sys
import re
from ddgs import DDGS

def buscar_imagen_web(termino_busqueda):
    try:
        query = re.sub(r'[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]', '', termino_busqueda)
        ddgs = DDGS()
        resultados = list(ddgs.images(query, max_results=1))
        if resultados:
            print(resultados[0]['image'])
            return
    except Exception as e:
        pass
    print("")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        buscar_imagen_web(sys.argv[1])
    else:
        print("")

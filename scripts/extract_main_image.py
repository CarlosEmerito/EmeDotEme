import sys
import requests
from bs4 import BeautifulSoup

def extract_main_image(url):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; EmeDotEmeBot/1.0)'
        }
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        # Buscar og:image
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            print(og_image['content'])
            return
        # Buscar Twitter image
        twitter_image = soup.find('meta', property='twitter:image')
        if twitter_image and twitter_image.get('content'):
            print(twitter_image['content'])
            return
        # Buscar primera imagen en el contenido
        img = soup.find('img')
        if img and img.get('src'):
            print(img['src'])
            return
    except Exception as e:
        pass
    print("")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        extract_main_image(sys.argv[1])
    else:
        print("")

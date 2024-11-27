import urllib.request
import os

# Create audio directory if it doesn't exist
os.makedirs('audio', exist_ok=True)

# Sound URLs (using free sound effects)
sounds = {
    'background': 'https://www.chosic.com/wp-content/uploads/2020/07/The-Epic-Hero-Power.mp3',
    'hit': 'https://www.soundjay.com/buttons/sounds/button-09.mp3',
    'levelup': 'https://www.soundjay.com/misc/sounds/level-up-01.mp3',
    'gameover': 'https://www.soundjay.com/misc/sounds/fail-buzzer-03.mp3',
    'mystery': 'https://www.soundjay.com/misc/sounds/magic-chime-01.mp3'
}

# Download sounds
for name, url in sounds.items():
    print(f"Downloading {name}.mp3...")
    try:
        urllib.request.urlretrieve(url, f'audio/{name}.mp3')
        print(f"Downloaded {name}.mp3")
    except Exception as e:
        print(f"Error downloading {name}.mp3: {e}")

print("Done downloading sounds!")

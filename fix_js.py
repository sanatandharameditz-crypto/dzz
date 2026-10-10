import os
import re

d = r'c:\Users\Aashish\Desktop\DUELZONE DESIGN'
skips = ['index.html', 'play.html', 'checkers.html', 'chess.html', 'ludo.html', 'tetris.html']

for f in os.listdir(d):
    if not f.endswith('.html') or f in skips: continue
    p = os.path.join(d, f)
    with open(p, 'r', encoding='utf8') as file:
        content = file.read()
    orig = content

    # The prefix can be found by looking at the setup div ID, e.g., id="ah-setup"
    m = re.search(r'id="([a-z0-9]+)-setup"', content)
    if m:
        pfx = m.group(1)
        # Fix querySelectors in the JS
        content = content.replace(f"('.{pfx}-mode-card')", "('.dz-mode-card')")
        content = content.replace(f"('.{pfx}-mode-card.selected')", "('.dz-mode-card.selected')")
        
        content = content.replace(f"('.{pfx}-theme-card')", "('.dz-swatch')")
        content = content.replace(f"('.{pfx}-theme-card.selected')", "('.dz-swatch.selected')")
        
        # also the sound toggle ID was ah-sound-toggle, wait did I change the ID?
        # My previous script did NOT change IDs. It only changed classes!
        # content = content.replace(new RegExp(pfx + '-switch', 'g'), 'dz-toggle');
        # So the IDs are still ah-sound-toggle, which is fine, the JS queries getElementById('ah-sound-toggle').
        
        if content != orig:
            with open(p, 'w', encoding='utf8') as file:
                file.write(content)
            print(f"Fixed JS in {f}")

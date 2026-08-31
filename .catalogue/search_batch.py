import urllib.request, urllib.parse, re, sys, json, time

songs = [
("Adamlar","Kürdan"),
("Adamlar","Bir Kadın Çizeceksin"),
("Adamlar","Bu Akşam"),
("Adamlar","Bu Gece Ölürüz"),
("Büyük Ev Ablukada","Islak Islak"),
("Büyük Ev Ablukada","Cadde"),
("Büyük Ev Ablukada","Dert Bende"),
("Büyük Ev Ablukada","Cimri"),
("Son Feci Bisiklet","Tatlım Sakin Ol"),
("Son Feci Bisiklet","Beni Kör Kuyularda Sal Bulsun"),
]

def search(artist, title):
    q = urllib.parse.quote(f"{artist} {title}")
    url = f"https://www.youtube.com/results?search_query={q}"
    req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"})
    try:
        html = urllib.request.urlopen(req, timeout=15).read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"ERROR {artist} - {title}: {e}")
        return []
    ids = re.findall(r'"videoId":"([^"]+)"', html)
    seen = []
    for i in ids:
        if i not in seen:
            seen.append(i)
        if len(seen) >= 3:
            break
    return seen

for artist, title in songs:
    ids = search(artist, title)
    print(f"{artist} | {title} => {ids}")
    time.sleep(0.5)

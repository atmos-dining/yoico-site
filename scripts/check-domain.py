#!/usr/bin/env python3
"""Verify the deployed canonical site with normal TLS verification."""
import concurrent.futures
import json
import urllib.request
from html.parser import HTMLParser

BASE = 'https://yoico-nishijin.com/'
PAGES = ['', 'menu.html', 'drink.html', 'blog/', 'privacy.html', 'admin/', 'sitemap.xml', 'robots.txt']
class Tags(HTMLParser):
    def __init__(self):
        super().__init__(); self.canonical = []; self.h1 = 0; self.structured = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'h1': self.h1 += 1
        if tag == 'link' and attrs.get('rel') == 'canonical': self.canonical.append(attrs.get('href'))
        if tag == 'script': self.structured = attrs.get('type') == 'application/ld+json'
    def handle_endtag(self, tag):
        if tag == 'script': self.structured = False
    def handle_data(self, value):
        if self.structured: json.loads(value)

def check(path):
    with urllib.request.urlopen(BASE + path, timeout=25) as response:
        assert response.status == 200
        text = response.read().decode('utf-8')
    if path in PAGES[:5]:
        tags = Tags(); tags.feed(text)
        assert tags.h1 == 1, (path, 'h1')
        assert tags.canonical == [BASE + path], (path, tags.canonical)
        assert 'https://atmos-dining.github.io/yoico-site/' not in text
    elif path == 'robots.txt': assert BASE + 'sitemap.xml' in text
    elif path == 'sitemap.xml': assert 'atmos-dining.github.io' not in text and BASE in text
    return {'path': path or '/', 'status': 'OK'}

if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        for result in executor.map(check, PAGES): print(json.dumps(result))
    for old in ['http://yoico-nishijin.com/', 'http://www.yoico-nishijin.com/', 'https://www.yoico-nishijin.com/', 'https://atmos-dining.github.io/yoico-site/']:
        with urllib.request.urlopen(old, timeout=25) as response:
            assert response.url == BASE, (old, response.url)
            print(json.dumps({'redirect': old, 'to': response.url}))
